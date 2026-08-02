/**
 * 浏览器端实况生成。
 *
 * 线上版原本要把原视频传到 Supabase、再借一台云端 Mac 跑 ffmpeg + makelive，
 * 光是排队和装环境就 35-40 秒。这里用浏览器自带的 WebCodecs 把同样的活做完：
 * 视频不出设备，实测合成一张 5 秒实况约 0.6 秒。
 *
 * iPhone 判定“这张图和这段视频是一对实况”，只看两个文件里是否写着同一个 UUID：
 *   JPG  —— EXIF MakerNote 里的 Apple 私有结构，tag 0x0011
 *   MOV  —— moov/meta 里的 com.apple.quicktime.content.identifier
 * 这两处都是固定字节结构，不需要 macOS 接口，所以整条链路可以离开 Mac。
 */
(function initializeBrowserLivePhoto() {
  "use strict";

  const OUTPUT_WIDTH = 1080;
  const OUTPUT_HEIGHT = 1440;
  const OUTPUT_FPS = 30;
  const WELL_RADIUS = 26;
  // 服务端等价设置是 libx264 CRF 18；1080x1440 30fps 下约 6Mbps 与之体积相当。
  const VIDEO_BITRATE = 6_000_000;
  const CODEC_CANDIDATES = ["avc1.4d0028", "avc1.640028", "avc1.42e01e"];
  // 分批交付样本，够用就停；批次太大等于一次性提取整段，大文件会卡住主线程。
  const VIDEO_BATCH = 120;
  const AUDIO_BATCH = 400;

  function supported() {
    return Boolean(
      typeof window.VideoEncoder === "function" &&
        typeof window.VideoDecoder === "function" &&
        typeof window.OffscreenCanvas === "function" &&
        window.MP4Box &&
        window.Mp4Muxer &&
        window.JSZip,
    );
  }

  /* ---------------------------------------------------------------- 解复用 */

  async function demuxVideo(blob, windowStart = 0, windowEnd = Infinity) {
    const buffer = await blob.arrayBuffer();
    const file = window.MP4Box.createFile();
    const samples = [];
    const audioSamples = [];
    let track = null;
    let audioTrack = null;
    let description = null;
    let audioDescription = null;

    await new Promise((resolve, reject) => {
      let settled = false;
      let stopped = false;
      const stop = () => {
        if (stopped) return;
        stopped = true;
        try { file.stop(); } catch { /* 已经停了就算了 */ }
      };
      const finish = () => { if (!settled) { settled = true; stop(); resolve(); } };
      const fail = (message) => { if (!settled) { settled = true; stop(); reject(new Error(message)); } };
      // 样本分批到达，批与批之间可能隔很久（大文件尤其明显），
      // 所以既不拿计数也不拿「安静多久」当完成条件，而是看需要的时间窗有没有覆盖到。
      let idleTimer = 0;
      const markIdle = () => {
        window.clearTimeout(idleTimer);
        idleTimer = window.setTimeout(finish, 400);
      };
      const covered = (bucket) => bucket.length
        && bucket[bucket.length - 1].cts / bucket[bucket.length - 1].timescale >= windowEnd;

      file.onError = (error) => fail(`无法解析这段视频：${error}`);
      file.onReady = (info) => {
        track = info.videoTracks?.[0];
        if (!track) {
          fail("这个文件里没有找到画面轨道。");
          return;
        }
        const entries = file.getTrackById(track.id).mdia.minf.stbl.stsd.entries;
        for (const entry of entries) {
          const box = entry.avcC || entry.hvcC || entry.vpcC || entry.av1C;
          if (!box) continue;
          const stream = new window.DataStream(undefined, 0, window.DataStream.BIG_ENDIAN);
          box.write(stream);
          description = new Uint8Array(stream.buffer, 8); // 去掉 box header
        }
        // 实况是带声音的，音轨照原样搬过去（不重新编码，所以没有音质损失）。
        audioTrack = info.audioTracks?.[0] || null;
        if (audioTrack) {
          try {
            const audioEntries = file.getTrackById(audioTrack.id).mdia.minf.stbl.stsd.entries;
            for (const entry of audioEntries) {
              const esds = entry.esds;
              const config = esds?.esd?.descs?.[0]?.descs?.[0]?.data;
              if (config) audioDescription = new Uint8Array(config);
            }
          } catch {
            audioDescription = null;
          }
          file.setExtractionOptions(audioTrack.id, "audio", { nbSamples: AUDIO_BATCH });
        }
        // 小批交付、取够就停：一次性提取整段（nbSamples 给很大）会让 mp4box 把所有样本
        // 复制一遍，106MB / 40 秒的视频实测要 39 秒且全程阻塞主线程，而我们只要其中几秒。
        file.setExtractionOptions(track.id, null, { nbSamples: VIDEO_BATCH });
        file.start();
        markIdle();
      };
      file.onSamples = (_id, user, chunk) => {
        const bucket = user === "audio" ? audioSamples : samples;
        for (const sample of chunk) bucket.push(sample);
        if (covered(samples) && (!audioTrack || covered(audioSamples))) {
          window.clearTimeout(idleTimer);
          finish();
          return;
        }
        markIdle();
      };
      buffer.fileStart = 0;
      file.appendBuffer(buffer);
      file.flush();
      // 兜底：只有在完全没拿到画面时才判失败；大文件解析慢不该被误判成坏文件。
      window.setTimeout(() => (samples.length ? finish() : fail("这段视频的画面无法读取，请换一段视频。")), 90000);
    });

    if (!samples.length) throw new Error("这段视频没有可用的画面帧。");
    return { samples, track, description, audioSamples, audioTrack, audioDescription };
  }

  /* ------------------------------------------------- 逐帧合成并编码成 MP4 */

  /** 复刻服务端的取景逻辑：有裁剪框就按裁剪框，否则按 focus 百分比做 cover。 */
  function sourceRect(videoWidth, videoHeight, crop, focusX, focusY, targetWidth, targetHeight) {
    if (crop) {
      return {
        x: videoWidth * crop.x,
        y: videoHeight * crop.y,
        width: videoWidth * crop.width,
        height: videoHeight * crop.height,
      };
    }
    const scale = Math.max(targetWidth / videoWidth, targetHeight / videoHeight);
    const width = targetWidth / scale;
    const height = targetHeight / scale;
    return {
      x: (videoWidth - width) * (focusX / 100),
      y: (videoHeight - height) * (focusY / 100),
      width,
      height,
    };
  }

  async function pickCodec() {
    for (const codec of CODEC_CANDIDATES) {
      try {
        const support = await window.VideoEncoder.isConfigSupported({
          codec,
          width: OUTPUT_WIDTH,
          height: OUTPUT_HEIGHT,
          bitrate: VIDEO_BITRATE,
          framerate: OUTPUT_FPS,
        });
        if (support.supported) return codec;
      } catch {
        // 换下一个候选。
      }
    }
    throw new Error("当前浏览器不支持在本地生成实况视频。");
  }

  async function composeLiveVideo(options) {
    const { samples, track, description, audioSamples, audioTrack, audioDescription,
            pageBitmap, well, crop, focusX, focusY, startSeconds, durationSeconds, coverOffsetSeconds, keepSound, onProgress } = options;
    const codec = await pickCodec();
    const wantFrames = Math.round(durationSeconds * OUTPUT_FPS);
    // 封面帧直接从合成过程里截，不要再用 <video> 去读刚生成的 MOV：
    // moov 写在文件尾，部分浏览器根本加载不了，而且那是一次没必要的解码往返。
    const coverFrameIndex = clampInt(Math.round(coverOffsetSeconds * OUTPUT_FPS), 0, wantFrames - 1);
    let coverBlobPromise = null;

    const canvas = new OffscreenCanvas(OUTPUT_WIDTH, OUTPUT_HEIGHT);
    const context = canvas.getContext("2d", { alpha: false });
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    // 源是 AAC 就把音轨原样搬进成片；其它编码（少见）宁可静音也不做有损转码。
    const canCopyAudio = Boolean(
      keepSound && audioTrack && audioSamples?.length && audioDescription &&
      /mp4a/i.test(String(audioTrack.codec || "")),
    );
    const muxer = new window.Mp4Muxer.Muxer({
      target: new window.Mp4Muxer.ArrayBufferTarget(),
      video: { codec: "avc", width: OUTPUT_WIDTH, height: OUTPUT_HEIGHT, frameRate: OUTPUT_FPS },
      ...(canCopyAudio ? {
        audio: {
          codec: "aac",
          numberOfChannels: audioTrack.audio?.channel_count || 2,
          sampleRate: audioTrack.audio?.sample_rate || 44100,
        },
      } : {}),
      // moov 放在 mdat 之后：稍后往 moov 里插入 meta 时，mdat 位置不变，
      // stco 记录的样本偏移就仍然有效，不必逐条改写。
      fastStart: false,
    });

    let encoderError = null;
    const encoder = new window.VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (error) => { encoderError = error; },
    });
    encoder.configure({
      codec,
      width: OUTPUT_WIDTH,
      height: OUTPUT_HEIGHT,
      bitrate: VIDEO_BITRATE,
      framerate: OUTPUT_FPS,
      latencyMode: "quality",
    });

    const rect = sourceRect(track.video.width, track.video.height, crop, focusX, focusY, well.width, well.height);
    let kept = 0;
    let decoderError = null;

    const startMicros = Math.round(startSeconds * 1_000_000);
    const decoder = new window.VideoDecoder({
      output: (frame) => {
        try {
          // start 之前的帧只是用来建立参考帧，不参与合成。
          if (kept >= wantFrames || frame.timestamp < startMicros) return;
          context.drawImage(pageBitmap, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
          context.save();
          context.beginPath();
          context.roundRect(well.x, well.y, well.width, well.height, WELL_RADIUS);
          context.clip();
          context.drawImage(frame, rect.x, rect.y, rect.width, rect.height, well.x, well.y, well.width, well.height);
          context.restore();
          if (kept === coverFrameIndex) {
            coverBlobPromise = canvas.convertToBlob({ type: "image/jpeg", quality: 0.95 });
          }
          const composed = new VideoFrame(canvas, {
            timestamp: Math.round((kept * 1_000_000) / OUTPUT_FPS),
            duration: Math.round(1_000_000 / OUTPUT_FPS),
          });
          encoder.encode(composed, { keyFrame: kept % OUTPUT_FPS === 0 });
          composed.close();
          kept += 1;
          if (kept % 15 === 0) onProgress?.(kept / wantFrames);
        } finally {
          frame.close();
        }
      },
      error: (error) => { decoderError = error; },
    });
    decoder.configure({
      codec: track.codec,
      codedWidth: track.video.width,
      codedHeight: track.video.height,
      ...(description ? { description } : {}),
    });

    // 从 start 之前最近的关键帧开始送样：再往前的帧对结果没有影响，
    // 但少了这个关键帧，起点之后的 P 帧就没有参考可用。
    let firstIndex = 0;
    for (let index = 0; index < samples.length; index += 1) {
      const seconds = samples[index].cts / samples[index].timescale;
      if (seconds > startSeconds) break;
      if (samples[index].is_sync) firstIndex = index;
    }
    // 末尾多送一点，避免解码器因缺少后续样本而少吐最后一帧。
    const endSeconds = startSeconds + durationSeconds + 2 / OUTPUT_FPS;
    for (let index = firstIndex; index < samples.length; index += 1) {
      if (kept >= wantFrames) break;
      const sample = samples[index];
      if (sample.cts / sample.timescale > endSeconds) break;
      decoder.decode(new EncodedVideoChunk({
        type: sample.is_sync ? "key" : "delta",
        timestamp: Math.round((sample.cts * 1_000_000) / sample.timescale),
        duration: Math.round((sample.duration * 1_000_000) / sample.timescale),
        data: sample.data,
      }));
    }

    await decoder.flush();
    decoder.close();
    if (decoderError) throw new Error("这段视频的画面无法解码，请换一段视频。");
    if (!kept) throw new Error("所选片段没有取到画面，请调整开始时间后重试。");

    await encoder.flush();
    encoder.close();
    if (encoderError) throw new Error("实况视频编码失败，请重试。");

    // 音频直通：只挑所选时间窗内的样本，不解码也不重编码。
    // 时间戳要以「第一个保留的音频样本」为零点——muxer 要求每条轨道从 0 开始，
    // 而音频样本边界和 start 通常对不齐（差几十毫秒，听感上无影响）。
    if (canCopyAudio) {
      const endSeconds = startSeconds + durationSeconds;
      const kept = audioSamples.filter((sample) => {
        const seconds = sample.cts / sample.timescale;
        return seconds >= startSeconds && seconds < endSeconds;
      });
      if (kept.length) {
        const baseSeconds = kept[0].cts / kept[0].timescale;
        kept.forEach((sample, index) => {
          const chunk = new EncodedAudioChunk({
            type: "key",
            timestamp: Math.round(((sample.cts / sample.timescale) - baseSeconds) * 1_000_000),
            duration: Math.round((sample.duration / sample.timescale) * 1_000_000),
            data: sample.data,
          });
          muxer.addAudioChunk(chunk, index === 0 ? { decoderConfig: { description: audioDescription } } : undefined);
        });
      }
    }

    muxer.finalize();
    onProgress?.(1);
    // 极短片段可能还没走到封面帧位置就结束了，退回最后一帧。
    if (!coverBlobPromise) coverBlobPromise = canvas.convertToBlob({ type: "image/jpeg", quality: 0.95 });
    return { buffer: muxer.target.buffer, frames: kept, coverBlob: await coverBlobPromise };
  }

  function clampInt(value, min, max) {
    return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
  }

  /* ------------------------------------------- 往 MOV 里写 content identifier */

  function boxHeader(type, payloadLength) {
    const header = new Uint8Array(8);
    new DataView(header.buffer).setUint32(0, payloadLength + 8);
    for (let index = 0; index < 4; index += 1) header[4 + index] = type.charCodeAt(index);
    return header;
  }

  function concatBytes(parts) {
    const total = parts.reduce((sum, part) => sum + part.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const part of parts) { out.set(part, offset); offset += part.length; }
    return out;
  }

  const ascii = (text) => new TextEncoder().encode(text);

  /** moov/meta 里的 keys + ilst，Apple 就是从这里读实况身份码的。 */
  function buildMetaBox(contentId) {
    const key = "com.apple.quicktime.content.identifier";
    const keyBytes = ascii(key);

    const hdlrPayload = concatBytes([
      new Uint8Array(4),            // version + flags
      new Uint8Array(4),            // predefined
      ascii("mdta"),                // handler type
      new Uint8Array(12),           // reserved
      new Uint8Array(1),            // 空名字
    ]);
    const hdlr = concatBytes([boxHeader("hdlr", hdlrPayload.length), hdlrPayload]);

    const keyEntry = concatBytes([
      (() => { const b = new Uint8Array(4); new DataView(b.buffer).setUint32(0, keyBytes.length + 8); return b; })(),
      ascii("mdta"),
      keyBytes,
    ]);
    const keysPayload = concatBytes([
      new Uint8Array(4),            // version + flags
      (() => { const b = new Uint8Array(4); new DataView(b.buffer).setUint32(0, 1); return b; })(),
      keyEntry,
    ]);
    const keys = concatBytes([boxHeader("keys", keysPayload.length), keysPayload]);

    const valueBytes = ascii(contentId);
    const dataPayload = concatBytes([
      (() => { const b = new Uint8Array(4); new DataView(b.buffer).setUint32(0, 1); return b; })(), // type = UTF-8
      new Uint8Array(4),            // locale
      valueBytes,
    ]);
    const dataBox = concatBytes([boxHeader("data", dataPayload.length), dataPayload]);
    const item = concatBytes([
      (() => { const b = new Uint8Array(4); new DataView(b.buffer).setUint32(0, dataBox.length + 8); return b; })(),
      (() => { const b = new Uint8Array(4); new DataView(b.buffer).setUint32(0, 1); return b; })(), // 对应 keys 第 1 项
      dataBox,
    ]);
    const ilst = concatBytes([boxHeader("ilst", item.length), item]);

    // 注意：QuickTime 的 meta 不是 fullbox，开头不能有 version/flags。
    // 按 ISO 规范多写这 4 个字节，ffprobe 仍读得出来，但 AVFoundation 会直接读不到，
    // 实况就退化成一张普通图加一段视频。
    const metaPayload = concatBytes([hdlr, keys, ilst]);
    return concatBytes([boxHeader("meta", metaPayload.length), metaPayload]);
  }

  function injectContentIdentifier(buffer, contentId) {
    const bytes = new Uint8Array(buffer);
    const view = new DataView(bytes.buffer);
    const meta = buildMetaBox(contentId);

    let offset = 0;
    while (offset + 8 <= bytes.length) {
      const size = view.getUint32(offset);
      const type = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]);
      if (size < 8) break;
      if (type === "moov") {
        const end = offset + size;
        const patched = concatBytes([bytes.subarray(0, end), meta, bytes.subarray(end)]);
        new DataView(patched.buffer).setUint32(offset, size + meta.length);
        return patched;
      }
      offset += size;
    }
    throw new Error("生成的实况视频结构异常，请重试。");
  }

  /* ------------------------------------------- 往 JPG 里写 Apple MakerNote */

  /**
   * Apple MakerNote 是一段固定的小结构：
   *   "Apple iOS\0" + 版本 + "MM" + 一条 IFD(tag 0x0011 = ContentIdentifier)
   * 值放在 MakerNote 起点 +32 处。总共约 50 字节，与 macOS 接口无关。
   */
  function buildAppleMakerNote(contentId) {
    const value = concatBytes([ascii(contentId), new Uint8Array(1)]);
    const head = new Uint8Array(32);
    const view = new DataView(head.buffer);
    head.set(ascii("Apple iOS\0"), 0);
    view.setUint16(10, 1);          // 版本
    head.set(ascii("MM"), 12);      // 大端
    view.setUint16(14, 1);          // IFD 条目数
    view.setUint16(16, 0x0011);     // tag: ContentIdentifier
    view.setUint16(18, 2);          // type: ASCII
    view.setUint32(20, value.length);
    view.setUint32(24, 32);         // 值相对 MakerNote 起点的偏移
    view.setUint32(28, 0);          // 没有下一个 IFD
    return concatBytes([head, value]);
  }

  function buildExifApp1(makerNote) {
    const tiff = concatBytes([ascii("MM"), new Uint8Array([0, 0x2a]), (() => {
      const b = new Uint8Array(4); new DataView(b.buffer).setUint32(0, 8); return b;
    })()]);

    const ifd0 = new Uint8Array(2 + 12 + 4);
    const ifd0View = new DataView(ifd0.buffer);
    ifd0View.setUint16(0, 1);
    ifd0View.setUint16(2, 0x8769);  // ExifIFDPointer
    ifd0View.setUint16(4, 4);       // LONG
    ifd0View.setUint32(6, 1);
    ifd0View.setUint32(10, 26);     // ExifIFD 位置 = 8 + ifd0 长度
    ifd0View.setUint32(14, 0);

    const exifIfd = new Uint8Array(2 + 12 + 4);
    const exifView = new DataView(exifIfd.buffer);
    exifView.setUint16(0, 1);
    exifView.setUint16(2, 0x927c);  // MakerNote
    exifView.setUint16(4, 7);       // UNDEFINED
    exifView.setUint32(6, makerNote.length);
    exifView.setUint32(10, 26 + exifIfd.length);
    exifView.setUint32(14, 0);

    const body = concatBytes([tiff, ifd0, exifIfd, makerNote]);
    const header = new Uint8Array(4);
    new DataView(header.buffer).setUint16(0, 0xffe1);
    new DataView(header.buffer).setUint16(2, body.length + 2 + 6);
    return concatBytes([header, ascii("Exif\0\0"), body]);
  }

  function insertExif(jpegBytes, app1) {
    if (jpegBytes[0] !== 0xff || jpegBytes[1] !== 0xd8) throw new Error("封面帧不是有效的 JPEG。");
    const view = new DataView(jpegBytes.buffer, jpegBytes.byteOffset, jpegBytes.byteLength);
    let offset = 2;
    while (offset + 4 <= jpegBytes.length) {
      const marker = view.getUint16(offset);
      if (marker !== 0xffe0 && marker !== 0xffe1) break;   // 跳过既有 APP0/APP1
      offset += 2 + view.getUint16(offset + 2);
    }
    return concatBytes([jpegBytes.subarray(0, offset), app1, jpegBytes.subarray(offset)]);
  }

  /* ------------------------------------------------------------------ 入口 */

  /**
   * @returns {Promise<{blob: Blob, archiveName: string, assetId: string, stem: string}>}
   */
  async function renderLivePhoto(options) {
    const {
      videoBlob,
      pageCanvas,
      well,
      platform = "xhs",
      start = 0,
      coverOffset = 0.2,
      focusX = 50,
      focusY = 50,
      crop = null,
      sound = true,
      title = "live-photo",
      onProgress = null,
    } = options;

    if (!supported()) throw new Error("当前浏览器不支持在本地生成实况，请改用云端生成。");
    const durationSeconds = platform === "wechat" ? 3 : 5;
    const suffix = platform === "wechat" ? "WECHAT_3S" : "XHS_5S";

    onProgress?.({ stage: "demux", progress: 6, detail: "正在读取视频画面…" });
    // 只解出所选时间窗，末尾留两帧余量给解码器补参考帧。
    const { samples, track, description, audioSamples, audioTrack, audioDescription } =
      await demuxVideo(videoBlob, start, start + durationSeconds + 2 / OUTPUT_FPS);

    const available = track.duration / track.timescale;
    if (start + durationSeconds > available + 0.05) {
      throw new Error(`所选片段需要 ${durationSeconds} 秒，但视频从当前起点只剩 ${Math.max(0, available - start).toFixed(2)} 秒。`);
    }

    onProgress?.({ stage: "compose", progress: 14, detail: "正在合成卡片与实况画面…" });
    const pageBitmap = await createImageBitmap(pageCanvas);
    let composed;
    try {
      composed = await composeLiveVideo({
        samples, track, description, audioSamples, audioTrack, audioDescription,
        pageBitmap, well, crop, focusX, focusY,
        startSeconds: start,
        durationSeconds,
        coverOffsetSeconds: coverOffset,
        keepSound: sound,
        onProgress: (ratio) => onProgress?.({
          stage: "compose",
          progress: 14 + Math.round(ratio * 60),
          detail: "正在合成卡片与实况画面…",
        }),
      });
    } finally {
      pageBitmap.close?.();
    }

    onProgress?.({ stage: "package", progress: 80, detail: "正在写入实况标记…" });
    const assetId = (window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`).toUpperCase();
    const movieBytes = injectContentIdentifier(composed.buffer, assetId);

    const coverBytes = new Uint8Array(await composed.coverBlob.arrayBuffer());
    const photoBytes = insertExif(coverBytes, buildExifApp1(buildAppleMakerNote(assetId)));

    onProgress?.({ stage: "package", progress: 92, detail: "正在打包 .pvt…" });
    const stem = `${safeStem(title)}_${suffix}_LIVE`;
    // 批量导出要把多页拼进同一个 ZIP，所以把散件也一并交出去，避免再拆一次压缩包。
    const parts = [
      { path: `${stem}.pvt/${stem}.MOV`, bytes: movieBytes },
      { path: `${stem}.pvt/${stem}.JPG`, bytes: photoBytes },
      { path: `${stem}.pvt/metadata.plist`, bytes: ascii(PLIST) },
    ];
    const zip = new window.JSZip();
    for (const part of parts) zip.file(part.path, part.bytes);
    // 媒体本身已经压缩过，STORE 省掉一次无谓的再压缩。
    const blob = await zip.generateAsync({ type: "blob", compression: "STORE" });

    onProgress?.({ stage: "complete", progress: 100, detail: "实况发布包已完成。" });
    return { blob, archiveName: `${stem}.zip`, assetId, stem, parts, frames: composed.frames };
  }

  function safeStem(value) {
    const cleaned = String(value || "")
      .replace(/[^\w㐀-鿿-]+/gu, "-")
      .replace(/-+/g, "-")
      .replace(/^[-_]+|[-_]+$/g, "");
    return cleaned.slice(0, 36) || "live-photo";
  }

  const PLIST = '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n'
    + '<plist version="1.0">\n<dict>\n\t<key>PFVideoComplementMetadataVersionKey</key>\n\t<string>1</string>\n</dict>\n</plist>\n';

  /* ------------------------------------------------------------ 直接分享 */

  /**
   * iOS 是靠 JPG 和 MOV 里同一个身份码把两个文件认成一张实况的，
   * 所以分享时要把这两个散件一起交出去；.pvt 是 macOS 的目录包，浏览器造不出来，
   * 而且 AirDrop 到 iPhone 也不会被识别。
   */
  function liveFilesFromParts(parts, stem) {
    const pick = (suffix, type) => {
      const part = parts.find((item) => item.path.endsWith(suffix));
      return part ? new File([part.bytes], `${stem}${suffix}`, { type }) : null;
    };
    return [pick(".JPG", "image/jpeg"), pick(".MOV", "video/quicktime")].filter(Boolean);
  }

  function canShareLive(parts, stem) {
    if (typeof navigator.canShare !== "function" || typeof navigator.share !== "function") return false;
    try {
      return navigator.canShare({ files: liveFilesFromParts(parts, stem) });
    } catch {
      return false;
    }
  }

  /** 打开系统分享面板；在 macOS / iOS 上里面就有「隔空投送」。 */
  async function shareLive(parts, stem, title = "实况照片") {
    const files = liveFilesFromParts(parts, stem);
    if (!files.length) throw new Error("实况文件已经失效，请重新生成。");
    if (typeof navigator.share !== "function") {
      throw new Error("当前浏览器不支持直接分享，请改用下载。");
    }
    try {
      await navigator.share({ files, title });
      return true;
    } catch (error) {
      if (error?.name === "AbortError") return false;   // 用户自己取消了
      throw new Error("系统分享面板没有打开，请改用下载。");
    }
  }

  window.WriteThenPublishBrowserLivePhoto = {
    supported, renderLivePhoto, canShareLive, shareLive,
    OUTPUT_WIDTH, OUTPUT_HEIGHT,
  };
})();

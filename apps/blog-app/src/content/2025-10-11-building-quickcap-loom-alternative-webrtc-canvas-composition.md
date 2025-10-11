---
title: Building QuickCap - A Loom Alternative with WebRTC and Canvas Composition
slug: 2025-10-11-building-quickcap-loom-alternative-webrtc-canvas-composition
description: A deep dive into building a screen recording application with real-time webcam overlay, high-quality video recording, and local file saving. Explores WebRTC APIs, Canvas composition, browser limitations, and performance optimization challenges.
categories: ['webrtc', 'javascript', 'canvas', 'video', 'browser-apis', 'performance', 'angular']
coverImage: https://dalenguyen.me/assets/images/blog/quickcap-screen-recording.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2025-10-11T00:00:00.000Z
author: Dale Nguyen
---

[QuickCap](https://quickcap.video) is a screen recording application built as a Loom alternative, featuring real-time webcam overlay, high-quality video recording, and local file saving. What started as a straightforward screen capture project evolved into a deep dive into modern Web APIs, browser limitations, and the complexities of real-time video composition.

This post chronicles the technical journey, architectural decisions, and the numerous pitfalls encountered while building a production-ready screen recording application using Canvas API, MediaRecorder, and modern web standards.

## Product Overview

### Core Features

- **Screen + Webcam Recording**: Simultaneous capture of screen content and webcam feed
- **Moveable Webcam Overlay**: Circular webcam overlay with adjustable position and size
- **Audio from Multiple Sources**: Captures both system audio and microphone input
- **Local File Saving**: Uses File System Access API with download fallback
- **High Quality Output**: VP9/Opus encoding at 8 Mbps bitrate
- **Browser Compatibility**: Chrome 72+, Firefox 66+, Edge 79+

### Architecture

QuickCap webapp is built using modern Angular architecture:

- **Web Application** (`apps/webapp/`): AnalogJS (Angular + Vite) frontend application
- **Service Layer**: Angular services managing recording state and media stream coordination
- **Component Architecture**: Standalone Angular components with reactive patterns
- **Recording Engine**: Built directly into the Angular service layer (no separate library used)

## Technical Stack

- **Frontend**: Angular with AnalogJS (Angular + Vite)
- **Video Processing**: HTML5 Canvas API for composition
- **Media Capture**: Navigator MediaDevices API (`getDisplayMedia`, `getUserMedia`)
- **Audio/Video Encoding**: MediaRecorder API with VP9/Opus codecs
- **File Handling**: File System Access API with download fallback
- **State Management**: RxJS Observables with Angular Signals
- **Build System**: Nx with Vite for modern development

## The Major Technical Challenges

### 1. Browser Tab Visibility Limitations

**The Problem**: The most significant challenge was browser tab throttling. When users switch away from the QuickCap tab, browsers pause video elements and throttle `requestAnimationFrame` to save resources. This caused:

- Webcam overlay disappearing from recordings
- Canvas composition freezing
- Incomplete screen capture during tab switches

**Initial Naive Approach**:

```typescript
// This fails when tab becomes inactive
private startComposition(): void {
  const draw = () => {
    // Canvas drawing code
    requestAnimationFrame(draw); // Gets throttled!
  };
  draw();
}
```

**The Solution - Dual Composition System**:

```typescript
private startComposition(): void {
  // Primary: requestAnimationFrame for performance when visible
  const draw = () => {
    this.forceCompositionUpdate();
    if (this.isTabVisible || this.isRecording) {
      this.animationFrame = requestAnimationFrame(draw);
    }
  };
  draw();
}

private ensureContinuousComposition(): void {
  // Backup: setInterval continues during tab switches
  const backupInterval = setInterval(() => {
    if (!this.isRecording) {
      clearInterval(backupInterval);
      return;
    }
    this.forceCompositionUpdate();
  }, 1000 / 30); // 30 FPS backup
}
```

**Lesson Learned**: Never rely solely on `requestAnimationFrame` for critical background processes. Always implement backup mechanisms for tab-invisible scenarios.

### 2. Video Stream Recording Architecture

**The Dilemma**: Should we record the raw screen stream or the composited canvas stream?

**Approach 1 - Raw Screen Stream**:

```typescript
// Captures tab switches reliably but no webcam overlay
const screenVideoTrack = this.screenStream.getVideoTracks()[0]
combinedStream.addTrack(screenVideoTrack.clone())
// ❌ Problem: No webcam overlay in final recording
```

**Approach 2 - Canvas Stream (Final Solution)**:

```typescript
// Industry standard: Canvas composition with captureStream()
const canvasStream = this.canvas.captureStream(30) // 30 FPS
const canvasVideoTrack = canvasStream.getVideoTracks()[0]
combinedStream.addTrack(canvasVideoTrack)

// Ensure canvas composition continues during tab switches
this.ensureContinuousComposition()
```

**Why Canvas Composition**:

- Used by industry leaders (Slack, Zoom, Google Meet)
- Allows real-time overlay composition
- Enables webcam positioning and effects
- Maintains consistent output format

**Lesson Learned**: Canvas composition with `captureStream()` is the industry standard, but requires robust backup mechanisms to handle browser throttling.

### 3. Video Element State Management

**The Challenge**: Video elements pause unpredictably when tabs become inactive, breaking the composition pipeline.

**Aggressive Video Restart Strategy**:

```typescript
private setupVideoEventListeners(video: HTMLVideoElement): void {
  // Auto-restart on pause
  video.addEventListener('pause', async () => {
    if (this.hasActiveStreams() && (this.isRecording || this.isTabVisible)) {
      try {
        await video.play();
        console.log('✅ Restarted paused video element');
      } catch (error) {
        console.warn('Failed to restart paused video:', error);
      }
    }
  });

  // Prevent suspension during recording
  if (this.isRecording) {
    video.addEventListener('suspend', () => {
      video.play().catch(error => {
        console.warn('Failed to prevent video suspend:', error);
      });
    });
  }
}
```

**Lesson Learned**: Video elements require constant babysitting in web applications. Implement multiple event listeners and recovery mechanisms.

### 4. Circular Webcam Overlay Implementation

**The Technical Challenge**: Drawing a circular webcam overlay with proper clipping and positioning.

**Canvas Clipping Implementation**:

```typescript
private drawCircularWebcam(): void {
  const { x, y, size } = this.webcamSettings;
  const radius = size / 2;

  // Convert slider values to canvas positions
  const xPercent = x / 800;
  const yPercent = y / 600;
  const availableWidth = Math.max(0, this.canvas.width - size);
  const availableHeight = Math.max(0, this.canvas.height - size);
  const actualX = availableWidth * xPercent;
  const actualY = availableHeight * yPercent;

  // Save canvas state
  this.ctx.save();

  // Create circular clipping mask
  this.ctx.beginPath();
  this.ctx.arc(actualX + radius, actualY + radius, radius, 0, 2 * Math.PI);
  this.ctx.clip();

  // Draw webcam video within the circle
  this.ctx.drawImage(this.webcamVideo, actualX, actualY, size, size);

  // Restore canvas state
  this.ctx.restore();

  // Draw border
  this.ctx.beginPath();
  this.ctx.arc(actualX + radius, actualY + radius, radius, 0, 2 * Math.PI);
  this.ctx.strokeStyle = '#ffffff';
  this.ctx.lineWidth = 3;
  this.ctx.stroke();
}
```

**Pitfalls Encountered**:

- Forgetting to save/restore canvas state caused clipping to persist
- Incorrect coordinate system mapping from UI sliders to canvas positions
- Performance issues with complex clipping paths at high frame rates

### 5. Audio Handling Complexity

**The Challenge**: Combining audio from multiple sources while maintaining sync.

**Multi-Source Audio Implementation**:

```typescript
// Add audio tracks from both screen and webcam streams
if (this.screenStream) {
  const audioTracks = this.screenStream.getAudioTracks()
  audioTracks.forEach((track) => {
    combinedStream.addTrack(track)
  })
}

if (this.webcamStream) {
  const audioTracks = this.webcamStream.getAudioTracks()
  audioTracks.forEach((track) => {
    combinedStream.addTrack(track)
  })
}
```

**Audio Pitfalls**:

- Chrome doesn't allow system audio from screen/window capture for security reasons
- Audio tracks can fail silently if permissions are denied
- Echo cancellation settings affect audio quality significantly
- Audio sync issues when video composition adds latency

### 6. MediaRecorder Configuration

**Codec Selection Strategy**:

```typescript
let options: MediaRecorderOptions
if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
  options = {
    mimeType: 'video/webm;codecs=vp9,opus',
    videoBitsPerSecond: 8000000,
    audioBitsPerSecond: 128000,
  }
} else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
  options = {
    mimeType: 'video/webm;codecs=vp8,opus',
    videoBitsPerSecond: 8000000,
    audioBitsPerSecond: 128000,
  }
} else {
  // Fallback to browser default
  options = {
    videoBitsPerSecond: 8000000,
    audioBitsPerSecond: 128000,
  }
}
```

**Encoding Challenges**:

- Browser support varies significantly across codec options
- Bitrate settings need balancing between quality and file size
- Different browsers have different default codec preferences
- Hardware acceleration availability affects encoding performance

## Browser Compatibility Challenges

### Chrome vs Firefox vs Safari

**Chrome (Best Support)**:

- Full support for `getDisplayMedia()` and `getUserMedia()`
- File System Access API for native file saving
- Hardware acceleration for video encoding
- Reliable MediaRecorder implementation

**Firefox (Limited)**:

- Basic MediaDevices API support but missing advanced features
- No File System Access API (falls back to downloads)
- Different audio handling behavior
- Performance issues with high-resolution recording

**Safari (Minimal)**:

- Limited MediaDevices API implementation
- No File System Access API support
- Mobile Safari completely unsupported for screen recording
- Different codec support

**Compatibility Checker Implementation**:

```typescript
class CompatibilityChecker {
  private checkFeatures(): Features {
    return {
      getDisplayMedia: 'getDisplayMedia' in navigator.mediaDevices,
      getUserMedia: 'getUserMedia' in navigator.mediaDevices,
      mediaRecorder: 'MediaRecorder' in window,
      fileSystemAccess: 'showSaveFilePicker' in window,
      canvas: !!document.createElement('canvas').getContext,
      secureContext: window.isSecureContext,
      webm: MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus'),
      mp4: MediaRecorder.isTypeSupported('video/mp4;codecs=h264,aac'),
    }
  }
}
```

## Performance Optimization Challenges

### 1. Canvas Drawing Performance

**Problem**: Drawing video frames to canvas at 30 FPS is CPU-intensive.

**Optimization Strategies**:

- Implement frame dropping during high CPU usage
- Use `willReadFrequently` context attribute for frequent reads
- Optimize drawing operations with minimal canvas state changes
- Monitor performance with `requestAnimationFrame` timing

### 2. Memory Management

**Stream Cleanup Implementation**:

```typescript
private stopAllStreams(): void {
  // Stop recording stream
  if (this.currentRecordingStream) {
    this.currentRecordingStream.getTracks().forEach(track => {
      track.stop();
    });
    this.currentRecordingStream = null;
  }

  // Stop original streams
  if (this.screenStream) {
    this.screenStream.getTracks().forEach(track => track.stop());
    this.screenStream = null;
  }

  if (this.webcamStream) {
    this.webcamStream.getTracks().forEach(track => track.stop());
    this.webcamStream = null;
  }

  // Clean up MediaRecorder
  this.recorder = null;
}
```

**Memory Leaks to Watch**:

- Video streams that aren't properly stopped
- Canvas contexts accumulating in memory
- Event listeners not removed on component destruction
- Blob URLs not revoked after use

## Security and Privacy Considerations

### 1. HTTPS Requirement

**Critical Requirement**: MediaDevices API requires secure contexts (HTTPS) for camera and microphone access.

**Development Workaround**:

```typescript
// Only allow in secure contexts
if (!window.isSecureContext) {
  throw new Error('Screen recording requires HTTPS')
}
```

### 2. Permission Management

**User Permission Flow**:

```typescript
try {
  // Request screen sharing permission
  this.screenStream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: true,
  })

  // Request camera/microphone permission
  this.webcamStream = await navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: { echoCancellation: true, noiseSuppression: true },
  })
} catch (error) {
  if (error.name === 'NotAllowedError') {
    // Handle permission denied
  } else if (error.name === 'NotFoundError') {
    // Handle device not found
  }
}
```

**Privacy Considerations**:

- All processing happens client-side
- No data sent to external servers
- Users control what screen areas to share
- Clear indicators when recording is active

## File Saving Challenges

### File System Access API vs Download Fallback

**Modern Approach (Chrome 86+)**:

```typescript
try {
  const fileHandle = await window.showSaveFilePicker({
    suggestedName: `screen-recording-${Date.now()}.webm`,
    types: [
      {
        description: 'WebM video files',
        accept: { 'video/webm': ['.webm'] },
      },
    ],
  })

  const writable = await fileHandle.createWritable()
  await writable.write(this.videoBlob)
  await writable.close()
} catch (error) {
  // Fall back to download link
  this.downloadFallback()
}
```

**Fallback Implementation**:

```typescript
private downloadFallback(): void {
  const url = URL.createObjectURL(this.videoBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `screen-recording-${Date.now()}.webm`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

## Development Tools and Debugging

### Essential Debugging Techniques

**Media Stream Debugging**:

- Console logging of MediaRecorder events
- Track state monitoring for stream health
- Canvas frame rate monitoring
- Audio level testing for microphone input

**Performance Profiling**:

- Chrome DevTools Performance tab for frame drops
- Memory tab for leak detection
- Network tab for stream bandwidth usage

**Testing Across Browsers**:

```typescript
// Feature detection for cross-browser testing
const features = {
  getDisplayMedia: 'getDisplayMedia' in navigator.mediaDevices,
  getUserMedia: 'getUserMedia' in navigator.mediaDevices,
  mediaRecorder: 'MediaRecorder' in window,
  fileSystemAccess: 'showSaveFilePicker' in window,
}

console.log('Browser capabilities:', features)
```

## Lessons Learned and Best Practices

### 1. Always Plan for Browser Limitations

- Implement feature detection early
- Build graceful degradation paths
- Test extensively across browsers
- Document browser-specific behaviors

### 2. State Management is Critical

- Use reactive patterns (RxJS/Signals) for complex async operations
- Implement proper cleanup in component lifecycle
- Handle edge cases like rapid start/stop operations
- Maintain clear separation between UI and media logic

### 3. Error Handling Must Be Comprehensive

```typescript
// Example comprehensive error handling
try {
  await this.startRecording()
} catch (error) {
  if (error.name === 'NotAllowedError') {
    this.showError('Camera/microphone permission denied')
  } else if (error.name === 'NotFoundError') {
    this.showError('Camera or microphone not found')
  } else if (error.name === 'NotSupportedError') {
    this.showError('Screen sharing not supported in this browser')
  } else {
    this.showError('Recording failed. Please try again.')
  }

  // Always clean up on error
  this.cleanup()
}
```

### 4. Performance Optimization from Day One

- Profile early and often
- Implement frame dropping mechanisms
- Monitor memory usage patterns
- Use efficient canvas drawing techniques

### 5. User Experience Considerations

- Provide clear feedback during recording
- Show compatibility warnings upfront
- Implement proper loading states
- Handle network interruptions gracefully

## Architecture Deep Dive

### Angular Webapp Structure

```
apps/webapp/
├── src/app/components/             # Angular standalone components
│   ├── quickcap-recorder.component.ts     # Main recorder UI
│   ├── recording-area.component.ts        # Canvas and video management
│   ├── canvas-display.component.ts        # Canvas rendering
│   ├── video-preview.component.ts         # Video playback
│   └── saved-recordings.component.ts      # Storage management
└── src/app/services/               # Business logic services
    ├── record.service.ts           # Main recording coordination
    └── recording-storage.service.ts   # Local storage management
```

### Service Layer Architecture

**RecordService**: Main coordinator that manages:

- MediaStream acquisition via MediaDevices API
- Canvas composition and real-time rendering
- MediaRecorder lifecycle and configuration
- State management with RxJS observables and Angular signals
- Browser compatibility checking
- Tab visibility handling for continuous recording

**RecordingStorageService**: Handles local storage:

- Video blob storage and retrieval
- Recording metadata management
- File System Access API integration

### Component Architecture

**QuickCapRecorderComponent**: Main orchestrator that handles:

- User interaction and recording controls
- State management with Angular signals
- Service coordination and error handling
- Compatibility checking and user feedback

**RecordingAreaComponent**: Canvas management component:

- Canvas element lifecycle
- Video element references (screen/webcam)
- Preview display coordination

**CanvasDisplayComponent**: Pure rendering component:

- Canvas element creation and management
- Real-time display updates

## Future Improvements

### Technical Enhancements

1. **WebAssembly Integration**: Move video processing to WASM for better performance
2. **Web Workers**: Use OffscreenCanvas in Web Workers for background processing
3. **Real-time Effects**: Add filters, annotations, and effects during recording
4. **Multi-format Export**: Support MP4, AVI, and other formats
5. **Streaming Integration**: Direct streaming to platforms like YouTube/Twitch

### Architecture Improvements

1. **Plugin System**: Modular architecture for extensions
2. **Cloud Storage**: Integration with Google Drive, Dropbox
3. **Collaborative Features**: Multi-user recording sessions
4. **Analytics**: Recording usage and performance metrics

## Conclusion

Building QuickCap revealed the complexity hidden beneath seemingly simple screen recording functionality. The browser's security model, performance optimizations, and API limitations create a challenging environment for real-time video processing.

The key takeaways:

1. **Browser Tab Throttling**: The biggest unexpected challenge requiring dual composition systems
2. **Canvas Composition**: Industry standard but needs robust backup mechanisms
3. **Cross-Browser Support**: Requires extensive testing and fallback implementations
4. **Performance**: Real-time video processing is resource-intensive and needs careful optimization
5. **User Experience**: Technical complexity should remain hidden from users

The modern Web Platform provides powerful capabilities for building sophisticated video applications entirely in the browser. QuickCap demonstrates that with careful architecture and robust error handling, it's possible to create professional-grade screen recording applications using standard web technologies.

This technical deep-dive serves as a reference for developers tackling similar media capture challenges and highlights the real-world complexities of browser-based video applications.

## Technical Resources

- [MediaDevices.getDisplayMedia() - MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia)
- [MediaDevices.getUserMedia() - MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [MediaRecorder API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [Canvas API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [File System Access API](https://web.dev/file-system-access/)
- [Screen Capture API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API)

---

_This blog post documents the technical challenges and solutions encountered while building QuickCap, a browser-based screen recording application using modern Web APIs._

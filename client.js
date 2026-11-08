window.__ModuleLoader__.load({
  id: '@dakelinya0001/dsh-music-player',
  factory(require) {
    const React = require('react');
    const { useCallback, useEffect, useMemo, useRef, useState } = React;
    const h = React.createElement;
    let createPortal = null;
    try {
      const ReactDOM = require('react-dom');
      if (ReactDOM && typeof ReactDOM.createPortal === 'function') {
        createPortal = ReactDOM.createPortal;
      }
    } catch (error) {
      console.error('music player could not load react-dom for the workspace layer', error);
    }

    const NS = 'dsh-music-player';
    const DB_NAME = 'dsh-music-player';
    const DB_VERSION = 1;
    const STORE = 'tracks';
    const LS_VOLUME = 'dsh-music-player:volume';
    const LS_REPEAT = 'dsh-music-player:repeat';
    const LS_LAST = 'dsh-music-player:last';
    const LS_SETTINGS = 'dsh-music-player:settings';
    const DEFAULT_VINYL_COLOR = '#0a0b10';
    const DEFAULT_VINYL_LABEL_IMAGE =
      'data:image/svg+xml;charset=utf-8,' +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" fill="#ffffff"/></svg>'
      );
    const DEFAULT_SETTINGS = {
      spectrumEnabled: true,
      workspaceSpectrumEnabled: true,
      workspaceBarsPlacement: 'aboveInput',
      maxBarHeight: 200,
      barColor: '#4f8cff',
      barSpeed: 35,
      barOpacity: 64,
      cardOpacity: 64,
      playerTextColor: '',
      labelImage: '',
      vinylColor: DEFAULT_VINYL_COLOR,
      recordParticleSize: 100,
      recordParticleColor: '',
      barParticleSize: 100,
      barParticleColor: '',
      barGlowSize: 100,
      barGlowColor: '',
      particleCount: 50,
      shortcuts: {
        playPause: 'Space',
        previous: 'KeyA',
        next: 'KeyD'
      }
    };
    const SHORTCUT_ACTIONS = ['playPause', 'previous', 'next'];
    const SHORTCUT_CODE_RE =
      /^(Key[A-Z]|Digit[0-9]|Numpad[0-9]|F(?:[1-9]|1[0-2])|Space|Arrow(?:Up|Down|Left|Right)|Home|End|PageUp|PageDown)$/;

    function isShortcutCode(code) {
      return typeof code === 'string' && SHORTCUT_CODE_RE.test(code);
    }

    function particleAllocation(value) {
      const raw = Number(value);
      const total = Number.isFinite(raw)
        ? Math.max(0, Math.min(200, Math.round(raw)))
        : DEFAULT_SETTINGS.particleCount;
      if (total <= 0) {
        return { total: 0, record: 0, barBase: 0, barExtra: 0 };
      }
      const record = Math.max(1, Math.round(total * 0.36));
      const barTotal = Math.max(0, total - record);
      return {
        total,
        record,
        barBase: Math.floor(barTotal / 32),
        barExtra: barTotal % 32
      };
    }

    function shortcutCodeFromEvent(event) {
      if (!event) return null;
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return null;
      return isShortcutCode(event.code) ? event.code : null;
    }

    function shortcutLabel(code) {
      if (!code) return '—';
      if (code.indexOf('Key') === 0) return code.slice(3);
      if (code.indexOf('Digit') === 0) return code.slice(5);
      if (code.indexOf('Numpad') === 0) return 'Num ' + code.slice(6);
      const labels = {
        Space: 'Space',
        ArrowUp: '↑',
        ArrowDown: '↓',
        ArrowLeft: '←',
        ArrowRight: '→',
        Home: 'Home',
        End: 'End',
        PageUp: 'PgUp',
        PageDown: 'PgDn'
      };
      return labels[code] || code;
    }

    function normalizeShortcuts(value) {
      const defaults = DEFAULT_SETTINGS.shortcuts;
      const result = {};
      const used = new Set();
      let duplicate = false;
      for (let index = 0; index < SHORTCUT_ACTIONS.length; index += 1) {
        const action = SHORTCUT_ACTIONS[index];
        const candidate = value && isShortcutCode(value[action]) ? value[action] : defaults[action];
        if (used.has(candidate)) duplicate = true;
        result[action] = candidate;
        used.add(candidate);
      }
      return duplicate ? Object.assign({}, defaults) : result;
    }
    const AUDIO_EXT = /\.(mp3|m4a|aac|wav|flac|ogg|oga|opus|weba|webm|aiff?|alac|wma)$/i;

    const EN = {
      'sidebar.label': 'Music',
      'eyebrow': 'LOCAL AUDIO',
      'title': 'Music',
      'subtitle': 'Import local audio and play it without leaving DSH.',
      'import': 'Import music',
      'importing': 'Importing…',
      'playlist': 'Library',
      'searchPlaceholder': 'Search tracks',
      'emptyTitle': 'No music yet',
      'emptyBody': 'Choose audio files from your computer, or drop them anywhere on this panel.',
      'emptyAction': 'Choose audio files',
      'dragHint': 'You can also drag files here',
      'dropTitle': 'Drop to import',
      'dropBody': 'MP3, M4A, WAV, FLAC, OGG, Opus and more',
      'tracksUnit': 'tracks',
      'nowPlaying': 'Now playing',
      'noTrack': 'Nothing selected',
      'noTrackBody': 'Pick a track from the library to start listening.',
      'localAudio': 'Local audio',
      'play': 'Play',
      'pause': 'Pause',
      'previous': 'Previous track',
      'next': 'Next track',
      'repeat': 'Repeat mode',
      'repeat.off': 'Repeat off',
      'repeat.all': 'Repeat all',
      'repeat.one': 'Repeat one',
      'volume': 'Volume',
      'mute': 'Mute',
      'unmute': 'Unmute',
      'remove': 'Remove',
      'loading': 'Loading your library…',
      'unknownDuration': 'Unknown duration',
      'searchNoResults': 'No track matches that search.',
      'error.unsupported': 'No playable audio file was found.',
      'error.import': 'The import failed. Please try again.',
      'error.playback': 'This file cannot be played. Its format may be unsupported.',
      'error.storage': 'The local music library is unavailable.',
      'storageWarning': 'Browser storage is unavailable. Imported music will be lost after a refresh.',
      'dismiss': 'Dismiss',
      'currentTrack': 'Current track',
      'settings': 'Settings',
      'settingsTitle': 'Player settings',
      'settingsHint': 'Changes are saved automatically.',
      'settingsGeneral': 'General',
      'vinylOptions': 'Vinyl options',
      'vinylOptionsHint': 'Customize the record label image and the vinyl color.',
      'vinylLabelImage': 'Record label image',
      'vinylLabelImageHint': 'Choose an image for the center label. The default is a pure white image.',
      'vinylLabelDefault': 'Default white image',
      'vinylLabelCustom': 'Custom image',
      'chooseImage': 'Choose image',
      'processingImage': 'Processing…',
      'labelImageInvalid': 'Could not read that image. Choose a valid image file.',
      'vinylColor': 'Vinyl color',
      'vinylColorHint': 'Change the color of the vinyl body. The default is near-black.',
      'effectsOptions': 'Effects',
      'effectsHint': 'Adjust the size and color of record particles, bar particles, and bar glow.',
      'recordParticles': 'Record particles',
      'recordParticleSize': 'Record particle size',
      'recordParticleColor': 'Record particle color',
      'barParticles': 'Bar particles',
      'barParticleSize': 'Bar particle size',
      'barParticleColor': 'Bar particle color',
      'barGlow': 'Bar glow',
      'barGlowSize': 'Bar glow size',
      'barGlowColor': 'Bar glow color',
      'particleCount': 'Particle count',
      'particleCountWarning': '(This option may affect performance)',
      'particleCountHint': '0 hides all particles; higher values create more particles.',
      'followCover': 'Follow cover',
      'followBarColor': 'Follow bar color',
      'effectSizeHint': '100% is the default; 0% hides this effect.',
      'effectColorHint': 'A custom color overrides the automatic color.',
      'spectrumEnabled': 'Rhythm visualizer',
      'spectrumEnabledHint': 'Show audio-reactive bars behind the player content.',
      'workspaceSpectrumEnabled': 'Show bars in workspace',
      'workspaceSpectrumEnabledHint': 'Render bars behind the workspace text without blocking interaction.',
      'workspaceBarsPlacement': 'Workspace bars position',
      'workspaceBarsPlacementHint': 'Choose whether the bars sit above the input or flush with the bottom.',
      'placementAboveInput': 'Above the input',
      'placementBottom': 'Flush with the bottom',
      'maxBarHeight': 'Maximum bar height',
      'barColor': 'Bar color',
      'barSpeed': 'Bar animation speed',
      'barSpeedHint': '10 = slowest, 100 = fastest',
      'barOpacity': 'Bar opacity',
      'barOpacityHint': '0 = transparent, 100 = opaque',
      'cardOpacity': 'Card background opacity',
      'cardOpacityHint': '0 = transparent, 100 = opaque',
      'playerTextColor': 'Player text color',
      'playerTextColorHint': 'Leave unset to follow the DSH theme text color.',
      'followTheme': 'Follow theme',
      'presets': 'Presets',
      'on': 'On',
      'off': 'Off',
      'close': 'Close',
      'autoSaved': 'Saved automatically',
      'resetAll': 'Reset all settings',
      'resetAllHint': 'Restore player settings to defaults. Your music library is not deleted.',
      'resetSetting': 'Reset',
      'resetSettingTitle': 'Reset to default',
      'resetConfirm': 'Reset all settings?',
      'resetConfirmAction': 'Reset',
      'cancel': 'Cancel',
      'shortcutsSection': 'Keyboard shortcuts',
      'shortcutsHint': 'Click a key, then press a new one. Esc cancels.',
      'shortcutPlayPause': 'Play / pause',
      'shortcutPrevious': 'Previous track',
      'shortcutNext': 'Next track',
      'pressKey': 'Press a key…',
      'shortcutInvalid': 'That key cannot be used. Try another.'
    };

    const ZH = {
      'sidebar.label': '音乐',
      'eyebrow': '本地音乐',
      'title': '音乐',
      'subtitle': '导入本地音频，在 DSH 里直接播放。',
      'import': '导入音乐',
      'importing': '正在导入…',
      'playlist': '音乐库',
      'searchPlaceholder': '搜索曲目',
      'emptyTitle': '还没有音乐',
      'emptyBody': '从电脑中选择音频文件，或把文件拖到面板中的任意位置。',
      'emptyAction': '选择音频文件',
      'dragHint': '也可以直接把文件拖到这里',
      'dropTitle': '松开以导入音乐',
      'dropBody': '支持 MP3、M4A、WAV、FLAC、OGG、Opus 等格式',
      'tracksUnit': '首',
      'nowPlaying': '正在播放',
      'noTrack': '未选择曲目',
      'noTrackBody': '从音乐库中选择一首，开始播放。',
      'localAudio': '本地音频',
      'play': '播放',
      'pause': '暂停',
      'previous': '上一首',
      'next': '下一首',
      'repeat': '循环模式',
      'repeat.off': '不循环',
      'repeat.all': '列表循环',
      'repeat.one': '单曲循环',
      'volume': '音量',
      'mute': '静音',
      'unmute': '取消静音',
      'remove': '删除',
      'loading': '正在载入音乐库…',
      'unknownDuration': '未知时长',
      'searchNoResults': '没有找到匹配的曲目。',
      'error.unsupported': '没有找到可播放的音频文件。',
      'error.import': '导入失败，请重试。',
      'error.playback': '无法播放这个文件，可能是不受支持的格式。',
      'error.storage': '无法访问本地音乐库。',
      'storageWarning': '浏览器存储不可用，导入的音乐在刷新页面后会丢失。',
      'dismiss': '关闭',
      'currentTrack': '当前曲目',
      'settings': '设置',
      'settingsTitle': '播放器设置',
      'settingsHint': '修改会自动保存。',
      'settingsGeneral': '常规',
      'vinylOptions': '黑胶唱片选项',
      'vinylOptionsHint': '自定义唱片标签图片和黑胶唱片颜色。',
      'vinylLabelImage': '唱片标签图片',
      'vinylLabelImageHint': '选择一张图片作为唱片中心标签，默认是一张纯白图片。',
      'vinylLabelDefault': '默认白图',
      'vinylLabelCustom': '自定义图片',
      'chooseImage': '选择图片',
      'processingImage': '处理中…',
      'labelImageInvalid': '图片读取失败，请选择有效的图片文件。',
      'vinylColor': '黑胶唱片颜色',
      'vinylColorHint': '调整黑胶唱片本体的颜色，默认接近黑色。',
      'effectsOptions': '特效',
      'effectsHint': '调整唱片粒子、频谱柱粒子和频谱柱光晕的大小与颜色。',
      'recordParticles': '唱片粒子',
      'recordParticleSize': '唱片粒子大小',
      'recordParticleColor': '唱片粒子颜色',
      'barParticles': '频谱柱粒子',
      'barParticleSize': '频谱柱粒子大小',
      'barParticleColor': '频谱柱粒子颜色',
      'barGlow': '频谱柱光晕',
      'barGlowSize': '频谱柱光晕大小',
      'barGlowColor': '频谱柱光晕颜色',
      'particleCount': '粒子数量',
      'particleCountWarning': '（此选项可能会影响性能）',
      'particleCountHint': '0 会隐藏所有粒子；数值越高，粒子数量越多。',
      'followCover': '跟随封面',
      'followBarColor': '跟随频谱柱颜色',
      'effectSizeHint': '100% 为默认大小，0% 会隐藏该特效。',
      'effectColorHint': '选择自定义颜色后会覆盖自动颜色。',
      'spectrumEnabled': '律动频谱',
      'spectrumEnabledHint': '在播放器文字下方显示随音频跳动的频谱柱。',
      'workspaceSpectrumEnabled': '在工作区显示频谱柱',
      'workspaceSpectrumEnabledHint': '在工作区文字下方显示频谱柱，不影响文字交互。',
      'workspaceBarsPlacement': '工作区频谱柱位置',
      'workspaceBarsPlacementHint': '选择频谱柱位于输入框上方还是工作区最底部。',
      'placementAboveInput': '输入框上方',
      'placementBottom': '紧贴底部',
      'maxBarHeight': '频谱柱最大高度',
      'barColor': '频谱柱颜色',
      'barSpeed': '频谱柱跳动速度',
      'barSpeedHint': '10 最慢，100 最快',
      'barOpacity': '频谱柱透明度',
      'barOpacityHint': '0 全透明，100 不透明',
      'cardOpacity': '背景卡片透明度',
      'cardOpacityHint': '0 全透明，100 不透明',
      'playerTextColor': '播放器文字颜色',
      'playerTextColorHint': '不设置时跟随 DSH 主题文字颜色。',
      'followTheme': '跟随主题',
      'presets': '预设颜色',
      'on': '开启',
      'off': '关闭',
      'close': '关闭',
      'autoSaved': '自动保存',
      'resetAll': '重置所有设置',
      'resetAllHint': '恢复播放器设置默认值，不会删除音乐库。',
      'resetSetting': '重置',
      'resetSettingTitle': '恢复默认值',
      'resetConfirm': '确定要重置所有设置吗？',
      'resetConfirmAction': '确认重置',
      'cancel': '取消',
      'shortcutsSection': '键盘快捷键',
      'shortcutsHint': '点击快捷键后按下新按键，Esc 取消。',
      'shortcutPlayPause': '播放 / 暂停',
      'shortcutPrevious': '上一首',
      'shortcutNext': '下一首',
      'pressKey': '按下按键…',
      'shortcutInvalid': '这个按键不能使用，请换一个。'
    };

    const MESSAGES = {
      'en': EN,
      'en-US': EN,
      'zh': ZH,
      'zh-CN': ZH,
      'zh-Hans': ZH
    };

    function readLS(key) {
      try {
        return window.localStorage.getItem(key);
      } catch (error) {
        return null;
      }
    }

    function writeLS(key, value) {
      try {
        if (value === null || value === '') window.localStorage.removeItem(key);
        else window.localStorage.setItem(key, value);
      } catch (error) {
        /* Preference persistence is optional. */
      }
    }

    function readSettings() {
      const raw = readLS(LS_SETTINGS);
      if (!raw) return Object.assign({}, DEFAULT_SETTINGS);
      try {
        const parsed = JSON.parse(raw);
        const max = Number(parsed && parsed.maxBarHeight);
        const speed = Number(parsed && parsed.barSpeed);
        const opacity = Number(parsed && parsed.barOpacity);
        const cardOpacity = Number(parsed && parsed.cardOpacity);
        const color = String((parsed && parsed.barColor) || '');
        const playerTextColor = String((parsed && parsed.playerTextColor) || '');
        const labelImage = String((parsed && parsed.labelImage) || '');
        const vinylColor = String((parsed && parsed.vinylColor) || '');
        const recordParticleSize = Number(parsed && parsed.recordParticleSize);
        const barParticleSize = Number(parsed && parsed.barParticleSize);
        const barGlowSize = Number(parsed && parsed.barGlowSize);
        const recordParticleColor = String((parsed && parsed.recordParticleColor) || '');
        const barParticleColor = String((parsed && parsed.barParticleColor) || '');
        const barGlowColor = String((parsed && parsed.barGlowColor) || '');
        const particleCount = Number(parsed && parsed.particleCount);
        return {
          spectrumEnabled:
            parsed && typeof parsed.spectrumEnabled === 'boolean'
              ? parsed.spectrumEnabled
              : DEFAULT_SETTINGS.spectrumEnabled,
          workspaceSpectrumEnabled:
            parsed && typeof parsed.workspaceSpectrumEnabled === 'boolean'
              ? parsed.workspaceSpectrumEnabled
              : DEFAULT_SETTINGS.workspaceSpectrumEnabled,
          workspaceBarsPlacement:
            parsed && parsed.workspaceBarsPlacement === 'bottom'
              ? 'bottom'
              : 'aboveInput',
          maxBarHeight: Number.isFinite(max)
            ? Math.max(0, Math.min(300, Math.round(max)))
            : DEFAULT_SETTINGS.maxBarHeight,
          barColor: /^#[0-9a-f]{6}$/i.test(color) ? color : DEFAULT_SETTINGS.barColor,
          barSpeed: Number.isFinite(speed)
            ? Math.max(10, Math.min(100, Math.round(speed)))
            : DEFAULT_SETTINGS.barSpeed,
          barOpacity: Number.isFinite(opacity)
            ? Math.max(0, Math.min(100, Math.round(opacity)))
            : DEFAULT_SETTINGS.barOpacity,
          cardOpacity: Number.isFinite(cardOpacity)
            ? Math.max(0, Math.min(100, Math.round(cardOpacity)))
            : DEFAULT_SETTINGS.cardOpacity,
          playerTextColor: /^#[0-9a-f]{6}$/i.test(playerTextColor)
            ? playerTextColor
            : '',
          labelImage: /^data:image\//i.test(labelImage) ? labelImage : '',
          vinylColor: /^#[0-9a-f]{6}$/i.test(vinylColor)
            ? vinylColor
            : DEFAULT_SETTINGS.vinylColor,
          recordParticleSize: Number.isFinite(recordParticleSize)
            ? Math.max(0, Math.min(200, Math.round(recordParticleSize)))
            : DEFAULT_SETTINGS.recordParticleSize,
          recordParticleColor: /^#[0-9a-f]{6}$/i.test(recordParticleColor)
            ? recordParticleColor
            : '',
          barParticleSize: Number.isFinite(barParticleSize)
            ? Math.max(0, Math.min(200, Math.round(barParticleSize)))
            : DEFAULT_SETTINGS.barParticleSize,
          barParticleColor: /^#[0-9a-f]{6}$/i.test(barParticleColor)
            ? barParticleColor
            : '',
          barGlowSize: Number.isFinite(barGlowSize)
            ? Math.max(0, Math.min(200, Math.round(barGlowSize)))
            : DEFAULT_SETTINGS.barGlowSize,
          barGlowColor: /^#[0-9a-f]{6}$/i.test(barGlowColor)
            ? barGlowColor
            : '',
          particleCount: Number.isFinite(particleCount)
            ? Math.max(0, Math.min(200, Math.round(particleCount)))
            : DEFAULT_SETTINGS.particleCount,
          shortcuts: normalizeShortcuts(parsed && parsed.shortcuts)
        };
      } catch (error) {
        return Object.assign({}, DEFAULT_SETTINGS);
      }
    }

    function createSettingsStore() {
      let snapshot = { settings: readSettings(), open: false };
      const listeners = new Set();
      const emit = () => {
        listeners.forEach((listener) => {
          try {
            listener();
          } catch (error) {
            console.error('music settings listener failed', error);
          }
        });
      };
      return {
        getSnapshot: () => snapshot,
        subscribe: (listener) => {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
        update: (patch) => {
          const settings = Object.assign({}, snapshot.settings, patch);
          snapshot = { settings, open: snapshot.open };
          writeLS(LS_SETTINGS, JSON.stringify(settings));
          emit();
        },
        reset: () => {
          const settings = Object.assign({}, DEFAULT_SETTINGS, {
            shortcuts: Object.assign({}, DEFAULT_SETTINGS.shortcuts)
          });
          snapshot = { settings, open: snapshot.open };
          writeLS(LS_SETTINGS, JSON.stringify(settings));
          emit();
        },
        open: () => {
          if (snapshot.open) return;
          snapshot = { settings: snapshot.settings, open: true };
          emit();
        },
        close: () => {
          if (!snapshot.open) return;
          snapshot = { settings: snapshot.settings, open: false };
          emit();
        },
        dispose: () => listeners.clear()
      };
    }

    function useSettingsStore(store) {
      const [snapshot, setSnapshot] = useState(() => store.getSnapshot());
      useEffect(() => store.subscribe(() => setSnapshot(store.getSnapshot())), [store]);
      return snapshot;
    }

    function uid() {
      if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID();
      }
      return 't-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
    }

    function isAudioFile(file) {
      if (!file) return false;
      const type = String(file.type || '').toLowerCase();
      if (type.indexOf('audio/') === 0) return true;
      return AUDIO_EXT.test(String(file.name || ''));
    }

    function titleFromFile(name) {
      const base = String(name || '').replace(/\.[^.]+$/, '').trim();
      return base || String(name || 'Untitled');
    }

    function formatDuration(value) {
      if (!Number.isFinite(value) || value < 0) return '--:--';
      const total = Math.floor(value);
      const hours = Math.floor(total / 3600);
      const minutes = Math.floor((total % 3600) / 60);
      const seconds = total % 60;
      if (hours > 0) {
        return hours + ':' + String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
      }
      return minutes + ':' + String(seconds).padStart(2, '0');
    }

    function formatBytes(value) {
      const bytes = Number(value) || 0;
      if (bytes <= 0) return '--';
      if (bytes < 1024 * 1024) return Math.max(1, Math.round(bytes / 1024)) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0) + ' MB';
    }

    function fileTypeLabel(track) {
      if (track.ext) return String(track.ext).toUpperCase();
      const name = String(track.name || '');
      const dot = name.lastIndexOf('.');
      if (dot >= 0 && dot < name.length - 1) return name.slice(dot + 1).toUpperCase();
      const type = String(track.type || '');
      const slash = type.indexOf('/');
      if (slash >= 0) return type.slice(slash + 1).toUpperCase();
      return 'AUDIO';
    }

    function shallowEqual(left, right) {
      if (left === right) return true;
      if (!left || !right) return false;
      const leftKeys = Object.keys(left);
      const rightKeys = Object.keys(right);
      if (leftKeys.length !== rightKeys.length) return false;
      for (let index = 0; index < leftKeys.length; index += 1) {
        const key = leftKeys[index];
        if (left[key] !== right[key]) return false;
      }
      return true;
    }

    const selectPlaying = (state) => state.playing;
    const selectPanelState = (state) => ({
      tracks: state.tracks,
      currentId: state.currentId,
      playing: state.playing,
      importing: state.importing,
      error: state.error,
      ready: state.ready,
      storage: state.storage
    });
    const selectPlayback = (state) => ({
      currentTime: state.currentTime,
      duration: state.duration
    });
    const selectTransport = (state) => ({
      volume: state.volume,
      muted: state.muted,
      repeat: state.repeat,
      playing: state.playing
    });

    class Player {
      constructor() {
        this.state = {
          tracks: [],
          currentId: null,
          playing: false,
          currentTime: 0,
          duration: 0,
          volume: 0.8,
          muted: false,
          repeat: 'all',
          ready: false,
          importing: false,
          error: null,
          storage: 'ok'
        };
        this.listeners = new Set();
        this.audio = null;
        this.objectUrl = null;
        this.db = null;
        this.dbPromise = null;
        this.disposed = false;
        this.audioContext = null;
        this.mediaSource = null;
        this.analyser = null;
        this.frequencyData = null;
        this.audioGraphFailed = false;

        const storedVolume = readLS(LS_VOLUME);
        if (storedVolume !== null) {
          const parsed = Number(storedVolume);
          if (Number.isFinite(parsed)) this.state.volume = Math.max(0, Math.min(1, parsed));
        }
        const storedRepeat = readLS(LS_REPEAT);
        if (storedRepeat === 'off' || storedRepeat === 'all' || storedRepeat === 'one') {
          this.state.repeat = storedRepeat;
        }

        this._onTimeUpdate = this._onTimeUpdate.bind(this);
        this._onLoadedMetadata = this._onLoadedMetadata.bind(this);
        this._onPlay = this._onPlay.bind(this);
        this._onPause = this._onPause.bind(this);
        this._onEnded = this._onEnded.bind(this);
        this._onError = this._onError.bind(this);

        this._load();
      }

      getState() {
        return this.state;
      }

      subscribe(listener) {
        this.listeners.add(listener);
        return () => {
          this.listeners.delete(listener);
        };
      }

      _patch(patch) {
        let changed = false;
        const keys = Object.keys(patch);
        for (let index = 0; index < keys.length; index += 1) {
          if (this.state[keys[index]] !== patch[keys[index]]) {
            changed = true;
            break;
          }
        }
        if (!changed) return;
        this.state = Object.assign({}, this.state, patch);
        this.listeners.forEach((listener) => {
          try {
            listener();
          } catch (error) {
            console.error('music player listener failed', error);
          }
        });
      }

      _track(id) {
        if (!id) return null;
        return this.state.tracks.find((track) => track.id === id) || null;
      }

      async _load() {
        try {
          const tracks = await this._getAll();
          if (this.disposed) return;
          tracks.sort((left, right) => (left.addedAt || 0) - (right.addedAt || 0));
          const lastId = readLS(LS_LAST);
          const current = tracks.find((track) => track.id === lastId) || tracks[0] || null;
          this._patch({
            tracks,
            currentId: current ? current.id : null,
            ready: true,
            storage: 'ok'
          });
          if (current) this._prepare(current);
        } catch (error) {
          console.error('music library unavailable', error);
          this._patch({ ready: true, storage: 'unavailable', error: null });
        }
      }

      _openDb() {
        if (this.dbPromise) return this.dbPromise;
        this.dbPromise = new Promise((resolve, reject) => {
          if (!window.indexedDB) {
            reject(new Error('IndexedDB is unavailable'));
            return;
          }
          let request;
          try {
            request = window.indexedDB.open(DB_NAME, DB_VERSION);
          } catch (error) {
            reject(error);
            return;
          }
          request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE)) {
              db.createObjectStore(STORE, { keyPath: 'id' });
            }
          };
          request.onsuccess = () => {
            this.db = request.result;
            resolve(request.result);
          };
          request.onerror = () => reject(request.error || new Error('Cannot open the music library'));
          request.onblocked = () => reject(new Error('The music library is blocked by another tab'));
        });
        return this.dbPromise;
      }

      async _getAll() {
        const db = await this._openDb();
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(STORE, 'readonly');
          const request = transaction.objectStore(STORE).getAll();
          request.onsuccess = () => resolve(Array.isArray(request.result) ? request.result : []);
          request.onerror = () => reject(request.error || new Error('Cannot read the music library'));
        });
      }

      async _put(track) {
        const db = await this._openDb();
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(STORE, 'readwrite');
          transaction.objectStore(STORE).put(track);
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error || new Error('Cannot save the track'));
          transaction.onabort = () => reject(transaction.error || new Error('Saving the track was aborted'));
        });
      }

      async _delete(id) {
        const db = await this._openDb();
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(STORE, 'readwrite');
          transaction.objectStore(STORE).delete(id);
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error || new Error('Cannot remove the track'));
        });
      }

      _ensureAudio() {
        if (this.audio) return this.audio;
        const audio = new Audio();
        audio.preload = 'metadata';
        audio.volume = this.state.volume;
        audio.addEventListener('timeupdate', this._onTimeUpdate);
        audio.addEventListener('loadedmetadata', this._onLoadedMetadata);
        audio.addEventListener('play', this._onPlay);
        audio.addEventListener('pause', this._onPause);
        audio.addEventListener('ended', this._onEnded);
        audio.addEventListener('error', this._onError);
        this.audio = audio;
        return audio;
      }

      /*
       * Build the analyser lazily, from a user gesture, so the AudioContext
       * starts in the allowed state. The graph is created once for the one
       * audio element and never per track. If Web Audio is unavailable the
       * normal media element path keeps working and the canvas stays idle.
       */
      _ensureAudioGraph() {
        if (this.analyser || this.audioGraphFailed || !this.audio) return;
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) {
          this.audioGraphFailed = true;
          return;
        }
        try {
          const context = new AudioContextClass();
          this.audioContext = context;
          const source = context.createMediaElementSource(this.audio);
          this.mediaSource = source;
          const analyser = context.createAnalyser();
          analyser.fftSize = 128;
          analyser.smoothingTimeConstant = 0.35;
          source.connect(analyser);
          analyser.connect(context.destination);
          this.analyser = analyser;
          this.frequencyData = new Uint8Array(analyser.frequencyBinCount);
          if (context.state === 'suspended') {
            context.resume().catch((error) => {
              console.error('cannot resume the music audio context', error);
            });
          }
        } catch (error) {
          console.error('cannot initialise the music analyser', error);
          this.audioGraphFailed = true;
          this.analyser = null;
          this.frequencyData = null;
          // Keep sound alive if the element source was already created.
          if (this.mediaSource && this.audioContext) {
            try {
              this.mediaSource.connect(this.audioContext.destination);
            } catch (connectError) {
              /* The element may already be connected. */
            }
          }
        }
      }

      readFrequencyData() {
        if (!this.analyser || !this.frequencyData) return null;
        try {
          this.analyser.getByteFrequencyData(this.frequencyData);
          return this.frequencyData;
        } catch (error) {
          return null;
        }
      }

      _revoke() {
        if (this.objectUrl) {
          try {
            URL.revokeObjectURL(this.objectUrl);
          } catch (error) {
            /* Nothing to release. */
          }
          this.objectUrl = null;
        }
      }

      _prepare(track) {
        if (this.disposed) return false;
        if (!track || !track.blob) {
          this._patch({ error: 'playback' });
          return false;
        }
        const audio = this._ensureAudio();
        this._revoke();
        try {
          this.objectUrl = URL.createObjectURL(track.blob);
        } catch (error) {
          console.error('cannot create audio URL', error);
          this._patch({ error: 'playback' });
          return false;
        }
        audio.src = this.objectUrl;
        audio.muted = this.state.muted;
        audio.volume = this.state.volume;
        try {
          audio.load();
        } catch (error) {
          /* load() is best effort before play(). */
        }
        this._patch({
          currentId: track.id,
          currentTime: 0,
          duration: Number(track.duration) || 0,
          error: null
        });
        writeLS(LS_LAST, track.id);
        return true;
      }

      _onTimeUpdate() {
        if (!this.audio) return;
        this._patch({ currentTime: this.audio.currentTime || 0 });
      }

      _onLoadedMetadata() {
        if (!this.audio || !Number.isFinite(this.audio.duration)) return;
        const duration = this.audio.duration;
        if (!(duration > 0)) return;
        this._patch({ duration });
        const track = this._track(this.state.currentId);
        if (track && Math.abs((Number(track.duration) || 0) - duration) > 0.5) {
          const updated = Object.assign({}, track, { duration });
          this._patch({
            tracks: this.state.tracks.map((item) => (item.id === track.id ? updated : item))
          });
          this._put(updated).catch((error) => {
            console.error('cannot persist track duration', error);
          });
        }
      }

      _onPlay() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
          this.audioContext.resume().catch((error) => {
            console.error('cannot resume the music audio context', error);
          });
        }
        this._patch({ playing: true });
      }

      _onPause() {
        this._patch({ playing: false });
      }

      _onEnded() {
        if (this.state.repeat === 'one') {
          this.seek(0);
          this.playTrack(this.state.currentId);
          return;
        }
        this.next(true);
      }

      _onError() {
        if (!this.audio || !this.objectUrl) return;
        console.error('music playback error', this.audio.error);
        this._patch({ playing: false, error: 'playback' });
      }

      playTrack(id) {
        if (this.disposed) return;
        const tracks = this.state.tracks;
        if (!tracks.length) return;
        let track = id ? this._track(id) : null;
        if (!track) track = this._track(this.state.currentId) || tracks[0];
        if (!track) return;
        if (this.state.currentId !== track.id || !this.audio || !this.audio.src) {
          if (!this._prepare(track)) return;
        }
        const audio = this.audio;
        if (!audio) return;
        this._ensureAudioGraph();
        audio.muted = this.state.muted;
        const request = audio.play();
        if (request && typeof request.catch === 'function') {
          request.catch((error) => {
            if (error && error.name === 'AbortError') return;
            console.error('cannot start playback', error);
            this._patch({ playing: false, error: 'playback' });
          });
        }
      }

      toggle() {
        if (!this.state.tracks.length) return;
        if (this.state.playing) {
          this.pause();
          return;
        }
        this.playTrack(this.state.currentId || this.state.tracks[0].id);
      }

      pause() {
        if (this.audio) this.audio.pause();
        this._patch({ playing: false });
      }

      seek(seconds) {
        const audio = this.audio;
        const duration = this.state.duration || (audio && Number.isFinite(audio.duration) ? audio.duration : 0);
        const target = Math.max(0, Math.min(Number(seconds) || 0, duration || 0));
        if (audio) {
          try {
            audio.currentTime = target;
          } catch (error) {
            /* Seeking before metadata is ready is harmless. */
          }
        }
        this._patch({ currentTime: target });
      }

      setVolume(value) {
        const volume = Math.max(0, Math.min(1, Number(value) || 0));
        if (this.audio) {
          this.audio.volume = volume;
          if (volume > 0) this.audio.muted = false;
        }
        this._patch({ volume, muted: volume > 0 ? false : this.state.muted });
        writeLS(LS_VOLUME, String(volume));
      }

      toggleMute() {
        const muted = !this.state.muted;
        if (this.audio) this.audio.muted = muted;
        this._patch({ muted });
      }

      cycleRepeat() {
        const modes = ['all', 'one', 'off'];
        const index = modes.indexOf(this.state.repeat);
        const repeat = modes[(index + 1) % modes.length];
        this._patch({ repeat });
        writeLS(LS_REPEAT, repeat);
      }

      next(auto) {
        const tracks = this.state.tracks;
        if (!tracks.length) return;
        if (auto && this.state.repeat === 'one') {
          this.seek(0);
          this.playTrack(this.state.currentId);
          return;
        }
        const index = tracks.findIndex((track) => track.id === this.state.currentId);
        let target = index + 1;
        if (target >= tracks.length) {
          if (auto && this.state.repeat === 'off') {
            this.pause();
            this._patch({ currentTime: this.state.duration });
            return;
          }
          target = 0;
        }
        if (target < 0) target = 0;
        this.playTrack(tracks[target].id);
      }

      previous() {
        const tracks = this.state.tracks;
        if (!tracks.length) return;
        if (this.audio && this.audio.currentTime > 3) {
          this.seek(0);
          return;
        }
        const index = tracks.findIndex((track) => track.id === this.state.currentId);
        const target = index <= 0 ? tracks.length - 1 : index - 1;
        this.playTrack(tracks[target].id);
      }

      remove(id) {
        const index = this.state.tracks.findIndex((track) => track.id === id);
        if (index < 0) return;
        const wasCurrent = this.state.currentId === id;
        const wasPlaying = this.state.playing;
        const tracks = this.state.tracks.filter((track) => track.id !== id);
        this._delete(id).catch((error) => {
          console.error('cannot delete the track', error);
        });
        if (!wasCurrent) {
          this._patch({ tracks });
          return;
        }
        if (this.audio) {
          this.audio.pause();
          this.audio.removeAttribute('src');
          try {
            this.audio.load();
          } catch (error) {
            /* Ignore a failed reset. */
          }
        }
        this._revoke();
        const nextTrack = tracks[Math.min(index, tracks.length - 1)] || null;
        this._patch({ tracks, currentId: null, playing: false, currentTime: 0, duration: 0 });
        if (nextTrack) {
          this._prepare(nextTrack);
          if (wasPlaying) this.playTrack(nextTrack.id);
        } else {
          writeLS(LS_LAST, '');
        }
      }

      clearError() {
        this._patch({ error: null });
      }

      importFiles(files) {
        if (this.disposed) return;
        const incoming = Array.isArray(files) ? files : Array.from(files || []);
        const audioFiles = incoming.filter(isAudioFile);
        if (!audioFiles.length) {
          this._patch({ error: 'unsupported' });
          return;
        }
        this._patch({ importing: true, error: null });
        (async () => {
          const added = [];
          let storageFailed = false;
          for (let index = 0; index < audioFiles.length; index += 1) {
            const file = audioFiles[index];
            const extMatch = /\.([^.]+)$/.exec(String(file.name || ''));
            const track = {
              id: uid(),
              name: titleFromFile(file.name),
              ext: extMatch ? extMatch[1].toUpperCase() : '',
              blob: file,
              type: file.type || 'application/octet-stream',
              size: file.size || 0,
              addedAt: Date.now() + index,
              duration: 0
            };
            try {
              await this._put(track);
            } catch (error) {
              storageFailed = true;
              console.error('cannot persist the imported track', error);
            }
            added.push(track);
          }
          const tracks = this.state.tracks.concat(added).sort((left, right) => {
            return (left.addedAt || 0) - (right.addedAt || 0);
          });
          this._patch({
            tracks,
            importing: false,
            storage: storageFailed ? 'unavailable' : this.state.storage
          });
          if (!this.state.currentId && tracks.length) this._prepare(tracks[0]);
        })().catch((error) => {
          console.error('music import failed', error);
          this._patch({ importing: false, error: 'import' });
        });
      }

      dispose() {
        this.disposed = true;
        if (this.audio) {
          this.audio.pause();
          this.audio.removeEventListener('timeupdate', this._onTimeUpdate);
          this.audio.removeEventListener('loadedmetadata', this._onLoadedMetadata);
          this.audio.removeEventListener('play', this._onPlay);
          this.audio.removeEventListener('pause', this._onPause);
          this.audio.removeEventListener('ended', this._onEnded);
          this.audio.removeEventListener('error', this._onError);
          this.audio.removeAttribute('src');
          try {
            this.audio.load();
          } catch (error) {
            /* Ignore teardown races. */
          }
          this.audio = null;
        }
        if (this.mediaSource) {
          try {
            this.mediaSource.disconnect();
          } catch (error) {
            /* Already disconnected. */
          }
          this.mediaSource = null;
        }
        if (this.analyser) {
          try {
            this.analyser.disconnect();
          } catch (error) {
            /* Already disconnected. */
          }
          this.analyser = null;
        }
        if (this.audioContext) {
          try {
            this.audioContext.close();
          } catch (error) {
            /* Already closed. */
          }
          this.audioContext = null;
        }
        this.frequencyData = null;
        this._revoke();
        if (this.db) {
          try {
            this.db.close();
          } catch (error) {
            /* Already closed. */
          }
          this.db = null;
        }
        this.listeners.clear();
      }
    }

    function IconPlay(props) {
      return h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: props.size || 18,
          height: props.size || 18,
          'aria-hidden': true,
          focusable: false
        },
        h('path', { d: 'M8 5.4v13.2L19 12 8 5.4Z', fill: 'currentColor' })
      );
    }

    function IconPause(props) {
      return h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: props.size || 18,
          height: props.size || 18,
          'aria-hidden': true,
          focusable: false
        },
        h('rect', { x: 6.5, y: 5, width: 4, height: 14, rx: 1.2, fill: 'currentColor' }),
        h('rect', { x: 13.5, y: 5, width: 4, height: 14, rx: 1.2, fill: 'currentColor' })
      );
    }

    function IconNext(props) {
      return h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: props.size || 18,
          height: props.size || 18,
          'aria-hidden': true,
          focusable: false
        },
        h('path', { d: 'M5.5 5.6v12.8L15 12 5.5 5.6Z', fill: 'currentColor' }),
        h('rect', { x: 16.5, y: 5, width: 2.2, height: 14, rx: 1, fill: 'currentColor' })
      );
    }

    function IconPrevious(props) {
      return h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: props.size || 18,
          height: props.size || 18,
          'aria-hidden': true,
          focusable: false
        },
        h('path', { d: 'M18.5 5.6v12.8L9 12l9.5-6.4Z', fill: 'currentColor' }),
        h('rect', { x: 5.3, y: 5, width: 2.2, height: 14, rx: 1, fill: 'currentColor' })
      );
    }

    function IconRepeat(props) {
      return h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: props.size || 18,
          height: props.size || 18,
          'aria-hidden': true,
          focusable: false
        },
        h('path', {
          d: 'M17 3.8 20.2 7 17 10.2M4 8.2V7a3 3 0 0 1 3-3h13.2M7 20.2 3.8 17 7 13.8M20 15.8V17a3 3 0 0 1-3 3H3.8',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.9,
          strokeLinecap: 'round',
          strokeLinejoin: 'round'
        })
      );
    }

    function IconVolume(props) {
      return h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: props.size || 18,
          height: props.size || 18,
          'aria-hidden': true,
          focusable: false
        },
        h('path', {
          d: 'M4 9.5h3.4L12 5.6v12.8L7.4 14.5H4V9.5Z',
          fill: 'currentColor'
        }),
        h('path', {
          d: 'M15.5 8.6a5 5 0 0 1 0 6.8M18.2 6a9 9 0 0 1 0 12',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.9,
          strokeLinecap: 'round'
        })
      );
    }

    function IconVolumeOff(props) {
      return h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: props.size || 18,
          height: props.size || 18,
          'aria-hidden': true,
          focusable: false
        },
        h('path', { d: 'M4 9.5h3.4L12 5.6v12.8L7.4 14.5H4V9.5Z', fill: 'currentColor' }),
        h('path', {
          d: 'm16 9.5 4 5M20 9.5l-4 5',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.9,
          strokeLinecap: 'round'
        })
      );
    }

    function IconTrash(props) {
      return h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: props.size || 17,
          height: props.size || 17,
          'aria-hidden': true,
          focusable: false
        },
        h('path', {
          d: 'M5 7h14M9.5 7V5h5v2M7.2 7l.8 12h8l.8-12M10 10.5v5M14 10.5v5',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.8,
          strokeLinecap: 'round',
          strokeLinejoin: 'round'
        })
      );
    }

    function IconUpload(props) {
      return h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: props.size || 16,
          height: props.size || 16,
          'aria-hidden': true,
          focusable: false
        },
        h('path', {
          d: 'M12 16V4.5M7.5 9 12 4.5 16.5 9M5 15.5v2.2A1.8 1.8 0 0 0 6.8 19.5h10.4a1.8 1.8 0 0 0 1.8-1.8v-2.2',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.9,
          strokeLinecap: 'round',
          strokeLinejoin: 'round'
        })
      );
    }

    function IconSearch(props) {
      return h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: props.size || 15,
          height: props.size || 15,
          'aria-hidden': true,
          focusable: false
        },
        h('circle', {
          cx: 10.8,
          cy: 10.8,
          r: 6.3,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.9
        }),
        h('path', {
          d: 'm15.5 15.5 4 4',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.9,
          strokeLinecap: 'round'
        })
      );
    }

    function IconClose(props) {
      return h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: props.size || 15,
          height: props.size || 15,
          'aria-hidden': true,
          focusable: false
        },
        h('path', {
          d: 'm6 6 12 12M18 6 6 18',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.9,
          strokeLinecap: 'round'
        })
      );
    }

    function IconReset(props) {
      return h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: props.size || 14,
          height: props.size || 14,
          'aria-hidden': true,
          focusable: false
        },
        h('path', {
          d: 'M20 11a8 8 0 1 0-2.34 5.66',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.8,
          strokeLinecap: 'round'
        }),
        h('path', {
          d: 'M20 4v7h-7',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.8,
          strokeLinecap: 'round',
          strokeLinejoin: 'round'
        })
      );
    }

    function SettingReset(props) {
      const label = props.title || props.t('resetSettingTitle');
      return h(
        'button',
        {
          type: 'button',
          className: 'dsh-music-setting-reset',
          title: label,
          'aria-label': label,
          disabled: !!props.disabled,
          onClick: props.onClick
        },
        h(IconReset, { size: 14 })
      );
    }

    function IconGear(props) {
      return h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: props.size || 17,
          height: props.size || 17,
          'aria-hidden': true,
          focusable: false
        },
        h('path', {
          d: 'M12 3.8l1.2 2.1 2.4-.5.7 2.3 2.2 1.1-1.2 2.1 1.2 2.1-2.2 1.1-.7 2.3-2.4-.5L12 20.2l-1.2-2.1-2.4.5-.7-2.3-2.2-1.1 1.2-2.1-1.2-2.1 2.2-1.1.7-2.3 2.4.5L12 3.8Z',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.5,
          strokeLinejoin: 'round'
        }),
        h('circle', {
          cx: 12,
          cy: 12,
          r: 3.1,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.6
        })
      );
    }

    function IconMusic(props) {
      return h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: props.size || 24,
          height: props.size || 24,
          'aria-hidden': true,
          focusable: false
        },
        h('path', {
          d: 'M9.5 18V5.8l9-2v11.4',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.8,
          strokeLinecap: 'round',
          strokeLinejoin: 'round'
        }),
        h('ellipse', { cx: 6.8, cy: 18, rx: 3, ry: 2.6, fill: 'currentColor' }),
        h('ellipse', { cx: 15.8, cy: 15.2, rx: 3, ry: 2.6, fill: 'currentColor' })
      );
    }

    function Equalizer() {
      return h(
        'span',
        { className: 'dsh-music-eq', 'aria-hidden': true },
        h('i', null),
        h('i', null),
        h('i', null)
      );
    }

    function usePlayerSelector(player, select, equal) {
      const [value, setValue] = useState(() => select(player.getState()));
      useEffect(() => {
        const update = () => {
          const next = select(player.getState());
          setValue((previous) => {
            if (equal ? equal(previous, next) : Object.is(previous, next)) return previous;
            return next;
          });
        };
        update();
        return player.subscribe(update);
      }, [player, select, equal]);
      return value;
    }

    function useLocaleTick(locale) {
      const [, setRevision] = useState(0);
      useEffect(() => {
        if (!locale || typeof locale.subscribe !== 'function') return undefined;
        return locale.subscribe(() => setRevision((value) => value + 1));
      }, [locale]);
    }

    function TrackRow(props) {
      const track = props.track;
      const active = props.active;
      const playing = active && props.playing;
      return h(
        'div',
        {
          className: 'dsh-music-row' + (active ? ' is-active' : ''),
          role: 'button',
          tabIndex: 0,
          onClick: () => props.onPlay(track.id),
          onKeyDown: (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              props.onPlay(track.id);
            }
          }
        },
        h(
          'div',
          { className: 'dsh-music-row-index' },
          playing ? h(Equalizer, null) : h('span', null, String(props.index + 1))
        ),
        h(
          'div',
          { className: 'dsh-music-row-main' },
          h('div', { className: 'dsh-music-row-title', title: track.name }, track.name),
          h(
            'div',
            { className: 'dsh-music-row-meta' },
            h('span', null, track.duration > 0 ? formatDuration(track.duration) : props.unknownDuration),
            h('span', { className: 'dsh-music-dot' }, '·'),
            h('span', null, fileTypeLabel(track)),
            h('span', { className: 'dsh-music-dot' }, '·'),
            h('span', null, formatBytes(track.size))
          )
        ),
        h(
          'button',
          {
            type: 'button',
            className: 'dsh-music-row-remove',
            title: props.removeLabel,
            'aria-label': props.removeLabel + ': ' + track.name,
            onClick: (event) => {
              event.stopPropagation();
              props.onRemove(track.id);
            },
            onKeyDown: (event) => {
              event.stopPropagation();
            }
          },
          h(IconTrash, { size: 16 })
        )
      );
    }

    const MemoTrackRow = React.memo(TrackRow);

    function VinylDisc(props) {
      const discRef = useRef(null);
      const angleRef = useRef(0);
      const velocityRef = useRef(0);

      useEffect(() => {
        const disc = discRef.current;
        if (!disc) return undefined;
        let frame = 0;
        let last = 0;

        const tick = (now) => {
          if (!last) last = now;
          const dt = Math.min(0.05, (now - last) / 1000);
          last = now;
          const playing = !!props.playing;
          const target = playing ? 0.55 : 0;
          const ease = playing ? 0.07 : 0.03;
          velocityRef.current += (target - velocityRef.current) * ease;

          if (!playing && velocityRef.current < 0.003) {
            velocityRef.current = 0;
            disc.style.transform = 'rotate(' + angleRef.current.toFixed(2) + 'deg)';
            return;
          }

          angleRef.current = (angleRef.current + velocityRef.current * dt * 360) % 360;
          disc.style.transform = 'rotate(' + angleRef.current.toFixed(2) + 'deg)';
          frame = requestAnimationFrame(tick);
        };

        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
      }, [props.playing]);

      return h(
        'div',
        { className: 'dsh-music-vinyl-disc', ref: discRef, 'aria-hidden': true },
        h('div', { className: 'dsh-music-vinyl-grooves' }),
        h(
          'div',
          { className: 'dsh-music-vinyl-label' },
          h('img', {
            className: 'dsh-music-vinyl-label-image',
            src: props.image || DEFAULT_VINYL_LABEL_IMAGE,
            alt: '',
            draggable: false
          })
        ),
        h('div', { className: 'dsh-music-vinyl-spindle' })
      );
    }

    function hexToRgb(value) {
      const raw = String(value || '').replace('#', '');
      if (!/^[0-9a-f]{6}$/i.test(raw)) return null;
      return {
        r: parseInt(raw.slice(0, 2), 16),
        g: parseInt(raw.slice(2, 4), 16),
        b: parseInt(raw.slice(4, 6), 16)
      };
    }

    function useCoverColor(src) {
      const [color, setColor] = useState({ r: 255, g: 255, b: 255 });
      useEffect(() => {
        let canceled = false;
        const image = new Image();
        image.onload = () => {
          if (canceled) return;
          try {
            const size = 24;
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const context = canvas.getContext('2d');
            if (!context) return;
            context.drawImage(image, 0, 0, size, size);
            const data = context.getImageData(0, 0, size, size).data;
            let best = null;
            let bestScore = -1;
            for (let index = 0; index < data.length; index += 4) {
              if (data[index + 3] < 128) continue;
              const r = data[index];
              const g = data[index + 1];
              const b = data[index + 2];
              const max = Math.max(r, g, b);
              const min = Math.min(r, g, b);
              const score = ((max - min) / 255) * 0.8 + (max / 255) * 0.2;
              if (score > bestScore) {
                bestScore = score;
                best = { r, g, b };
              }
            }
            if (!best) best = { r: 255, g: 255, b: 255 };
            const peak = Math.max(best.r, best.g, best.b);
            if (peak < 92) {
              best = {
                r: Math.round(best.r * 0.45 + 255 * 0.55),
                g: Math.round(best.g * 0.45 + 255 * 0.55),
                b: Math.round(best.b * 0.45 + 255 * 0.55)
              };
            }
            setColor(best);
          } catch (error) {
            /* Keep the neutral particle color when the cover cannot be sampled. */
          }
        };
        image.src = src || DEFAULT_VINYL_LABEL_IMAGE;
        return () => {
          canceled = true;
        };
      }, [src]);
      return color;
    }

    function ParticleField(props) {      const canvasRef = useRef(null);
      const coverColor = useCoverColor(props.cover);
      const customColor = hexToRgb(props.color);
      const color = customColor || coverColor;
      const colorRef = useRef(color);
      const requestedSize = Number(props.size);
      const sizeScale = Number.isFinite(requestedSize)
        ? Math.max(0, Math.min(200, requestedSize)) / 100
        : 1;
      const sizeRef = useRef(sizeScale);
      const recordParticleCount = particleAllocation(props.particleCount).record;
      const playingRef = useRef(!!props.playing);
      const startRef = useRef(null);
      colorRef.current = color;
      sizeRef.current = sizeScale;
      playingRef.current = !!props.playing;

      useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return undefined;
        const parent = canvas.parentElement;
        const context = canvas.getContext('2d');
        if (!parent || !context) return undefined;

        let width = 0;
        let height = 0;
        let dpr = 1;
        let frame = 0;
        let running = false;
        let last = 0;
        let intensity = 0;
        let particles = [];
        const geometry = { cx: 0, cy: 0, r: 60 };
        const art = props.artRef && props.artRef.current;

        const resize = () => {
          const rect = parent.getBoundingClientRect();
          const nextWidth = Math.max(1, Math.floor(rect.width));
          const nextHeight = Math.max(1, Math.floor(rect.height));
          const nextDpr = Math.min(2, window.devicePixelRatio || 1);
          if (nextWidth !== width || nextHeight !== height || nextDpr !== dpr) {
            width = nextWidth;
            height = nextHeight;
            dpr = nextDpr;
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            context.setTransform(dpr, 0, 0, dpr, 0, 0);
          }
          if (art) {
            const artRect = art.getBoundingClientRect();
            geometry.cx = artRect.left + artRect.width / 2 - rect.left;
            geometry.cy = artRect.top + artRect.height / 2 - rect.top;
            geometry.r = Math.max(
              20,
              (Math.min(artRect.width, artRect.height) / 2) * 1.12
            );
          } else {
            geometry.cx = width / 2;
            geometry.cy = height / 2;
            geometry.r = Math.max(20, Math.min(width, height) * 0.28);
          }
        };

        const makeParticle = (seeded) => {
          const angle = Math.random() * Math.PI * 2;
          const radius = geometry.r * (0.92 + Math.random() * 0.18);
          const speed = 0.12 + Math.random() * 0.55;
          return {
            x: geometry.cx + Math.cos(angle) * radius,
            y: geometry.cy + Math.sin(angle) * radius,
            vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 0.18,
            vy: Math.sin(angle) * speed + (Math.random() - 0.5) * 0.18 - 0.05,
            life: seeded ? Math.random() * 2.6 : 0,
            maxLife: 2.8 + Math.random() * 3.2,
            size: (0.8 + Math.random() * 2.1) * sizeRef.current,
            alphaScale: 0.35 + Math.random() * 0.5,
            drift: (Math.random() - 0.5) * 0.004
          };
        };
        const seed = () => {
          particles = [];
          for (let index = 0; index < recordParticleCount; index += 1) {
            particles.push(makeParticle(true));
          }
        };

        const tick = (now) => {
          if (!last) last = now;
          const dt = Math.min(0.05, (now - last) / 1000);
          last = now;
          const playing = playingRef.current;
          intensity += ((playing ? 1 : 0) - intensity) * (playing ? 0.08 : 0.04);
          context.clearRect(0, 0, width, height);
          context.globalCompositeOperation = 'lighter';
          const colorValue = colorRef.current;
          let visible = false;

          for (let index = 0; index < particles.length; index += 1) {
            const particle = particles[index];
            if (playing) {
              particle.life += dt;
              particle.x += particle.vx * dt * 60;
              particle.y += particle.vy * dt * 60;
              particle.vx += particle.drift * dt * 60;
              particle.vy += particle.drift * 0.5 * dt * 60 - 0.0008;
              if (particle.life >= particle.maxLife) {
                particles[index] = makeParticle(false);
                continue;
              }
            } else {
              const damping = Math.pow(0.98, dt * 60);
              particle.vx *= damping;
              particle.vy *= damping;
              particle.x += particle.vx * dt * 60;
              particle.y += particle.vy * dt * 60;
              particle.life += dt * 0.35;
              if (particle.life >= particle.maxLife) particle.life = particle.maxLife;
            }

            const phase = Math.min(1, Math.max(0, particle.life / particle.maxLife));
            const alpha = Math.max(
              0,
              Math.min(1, Math.sin(Math.PI * phase) * particle.alphaScale * intensity)
            );
            if (alpha <= 0.004) continue;
            visible = true;
            const tint = 'rgba(' + colorValue.r + ',' + colorValue.g + ',' + colorValue.b;
            context.fillStyle = tint + ',' + (alpha * 0.12).toFixed(3) + ')';
            context.beginPath();
            context.arc(particle.x, particle.y, particle.size * 2.8, 0, Math.PI * 2);
            context.fill();
            context.fillStyle = tint + ',' + alpha.toFixed(3) + ')';
            context.beginPath();
            context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            context.fill();
          }

          if (playing || intensity > 0.01 || visible) {
            frame = requestAnimationFrame(tick);
          } else {
            running = false;
            frame = 0;
          }
        };

        const start = () => {
          if (running) return;
          running = true;
          last = 0;
          frame = requestAnimationFrame(tick);
        };

        startRef.current = start;
        resize();
        seed();
        if (playingRef.current && recordParticleCount > 0) start();

        let observer = null;
        if (typeof ResizeObserver === 'function') {
          observer = new ResizeObserver(() => {
            resize();
            seed();
          });
          observer.observe(parent);
        }
        const onWindowResize = () => {
          resize();
          seed();
        };
        window.addEventListener('resize', onWindowResize);

        return () => {
          if (observer) observer.disconnect();
          window.removeEventListener('resize', onWindowResize);
          if (frame) cancelAnimationFrame(frame);
          frame = 0;
          running = false;
          startRef.current = null;
          context.clearRect(0, 0, width, height);
          particles = [];
        };
      }, [props.artRef, props.particleCount]);

      useEffect(() => {
        if (props.playing && particleAllocation(props.particleCount).record > 0 && startRef.current) {
          startRef.current();
        }
      }, [props.playing, props.particleCount]);

      return h('canvas', {
        ref: canvasRef,
        className: 'dsh-music-particle-canvas',
        'aria-hidden': true
      });
    }

    function NowPlaying(props) {
      const current = props.current;
      const shortcuts = props.shortcuts || DEFAULT_SETTINGS.shortcuts;
      const playback = usePlayerSelector(props.player, selectPlayback, shallowEqual);
      const transport = usePlayerSelector(props.player, selectTransport, shallowEqual);
      const t = props.t;
      const duration = playback.duration > 0 ? playback.duration : current && current.duration > 0 ? current.duration : 0;
      const progressMax = duration > 0 ? duration : 1;
      const progressValue = Math.min(playback.currentTime || 0, duration || 0);
      const repeatLabel = t('repeat.' + transport.repeat);

      return h(
        'div',
        { className: 'dsh-music-now' },
        h(ParticleField, {
          artRef: props.artRef,
          playing: transport.playing && !!current,
          cover: props.labelImage || DEFAULT_VINYL_LABEL_IMAGE,
          size: props.recordParticleSize,
          color: props.recordParticleColor,
          particleCount: props.particleCount
        }),
        h(
          'div',
          {
            ref: props.artRef,
            className:
              'dsh-music-art' +
              (current ? '' : ' is-empty') +
              (transport.playing ? ' is-playing' : ''),
            'aria-hidden': true
          },
          h(
            'div',
            { className: 'dsh-music-vinyl-plate' },
            h(
              'div',
              { className: 'dsh-music-vinyl' },
              h(VinylDisc, {
                playing: transport.playing && !!current,
                image: props.labelImage
              }),
              h('div', { className: 'dsh-music-vinyl-shine' })
            ),
            h(
              'div',
              { className: 'dsh-music-tonearm' },
            h(
              'svg',
              {
                className: 'dsh-music-tonearm-svg',
                viewBox: '0 0 240 240',
                'aria-hidden': true,
                focusable: false
              },
              h(
                'g',
                { className: 'dsh-music-tonearm-base' },
                h('circle', {
                  cx: 190,
                  cy: 30,
                  r: 18,
                  fill: '#222a35',
                  stroke: '#8b98aa',
                  strokeWidth: 2
                }),
                h('circle', { cx: 190, cy: 30, r: 9, fill: '#cbd5e1' }),
                h('circle', { cx: 190, cy: 30, r: 3, fill: '#0b0e13' })
              ),
              h(
                'g',
                { className: 'dsh-music-tonearm-arm' },
                h('rect', {
                  x: 194,
                  y: 19,
                  width: 24,
                  height: 12,
                  rx: 5,
                  fill: '#7f8b9c',
                  stroke: '#cbd5e1',
                  strokeWidth: 1.5
                }),
                h('path', {
                  d: 'M190 30 L124 92 L84 140',
                  fill: 'none',
                  stroke: '#cbd5e1',
                  strokeWidth: 5,
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round'
                }),
                h('rect', {
                  x: 72,
                  y: 132,
                  width: 20,
                  height: 26,
                  rx: 5,
                  fill: '#11161e',
                  stroke: '#cbd5e1',
                  strokeWidth: 2,
                  transform: 'rotate(36 82 145)'
                }),
                h('path', {
                  d: 'M82 146 L79 159',
                  fill: 'none',
                  stroke: '#e2e8f0',
                  strokeWidth: 2,
                  strokeLinecap: 'round'
                }),
                h('circle', { cx: 79, cy: 161, r: 2.8, fill: '#f8fafc' })
              )
            )
          )
        ),
        ),
        h(
          'div',
          { className: 'dsh-music-now-copy' },
          h('div', { className: 'dsh-music-now-label' }, t('nowPlaying')),
          h(
            'div',
            { className: 'dsh-music-now-title', title: current ? current.name : '' },
            current ? current.name : t('noTrack')
          ),
          h(
            'div',
            { className: 'dsh-music-now-sub' },
            current
              ? t('localAudio') + ' · ' + fileTypeLabel(current) + ' · ' + formatBytes(current.size)
              : t('noTrackBody')
          )
        ),
        current
          ? h(
              'div',
              { className: 'dsh-music-progress' },
              h('input', {
                type: 'range',
                min: 0,
                max: progressMax,
                step: 0.1,
                value: progressValue,
                disabled: duration <= 0,
                'aria-label': t('currentTrack'),
                onChange: (event) => props.player.seek(Number(event.target.value))
              }),
              h(
                'div',
                { className: 'dsh-music-times' },
                h('span', null, formatDuration(playback.currentTime || 0)),
                h('span', null, duration > 0 ? formatDuration(duration) : t('unknownDuration'))
              )
            )
          : null,
        h(
          'div',
          { className: 'dsh-music-controls' },
          h(
            'button',
            {
              type: 'button',
              className: 'dsh-music-iconbtn dsh-music-repeat' + (transport.repeat !== 'off' ? ' is-on' : ''),
              title: t('repeat') + ': ' + repeatLabel,
              'aria-label': t('repeat') + ': ' + repeatLabel,
              onClick: () => props.player.cycleRepeat()
            },
            h(IconRepeat, { size: 18 }),
            transport.repeat === 'one' ? h('span', { className: 'dsh-music-repeat-badge' }, '1') : null
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'dsh-music-iconbtn',
              title: t('previous') + ' (' + shortcutLabel(shortcuts.previous) + ')',
              'aria-label': t('previous') + ' (' + shortcutLabel(shortcuts.previous) + ')',
              disabled: !current,
              onClick: () => props.player.previous()
            },
            h(IconPrevious, { size: 19 })
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'dsh-music-playbtn',
              title: (transport.playing ? t('pause') : t('play')) + ' (' + shortcutLabel(shortcuts.playPause) + ')',
              'aria-label':
                (transport.playing ? t('pause') : t('play')) +
                ' (' +
                shortcutLabel(shortcuts.playPause) +
                ')',
              disabled: !current,
              onClick: () => props.player.toggle()
            },
            transport.playing ? h(IconPause, { size: 20 }) : h(IconPlay, { size: 20 })
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'dsh-music-iconbtn',
              title: t('next') + ' (' + shortcutLabel(shortcuts.next) + ')',
              'aria-label': t('next') + ' (' + shortcutLabel(shortcuts.next) + ')',
              disabled: !current,
              onClick: () => props.player.next(false)
            },
            h(IconNext, { size: 19 })
          )
        ),
        h(
          'div',
          { className: 'dsh-music-volume' },
          h(
            'button',
            {
              type: 'button',
              className: 'dsh-music-iconbtn dsh-music-mute',
              title: transport.muted ? t('unmute') : t('mute'),
              'aria-label': transport.muted ? t('unmute') : t('mute'),
              onClick: () => props.player.toggleMute()
            },
            transport.muted ? h(IconVolumeOff, { size: 17 }) : h(IconVolume, { size: 17 })
          ),
          h('input', {
            type: 'range',
            min: 0,
            max: 1,
            step: 0.01,
            value: transport.volume,
            'aria-label': t('volume'),
            onChange: (event) => props.player.setVolume(Number(event.target.value))
          })
        )
      );
    }

    function Spectrum(props) {
      const containerRef = useRef(null);
      const paintRef = useRef(null);
      const maxBarRef = useRef(props.maxBarHeight);
      const speedRef = useRef(props.barSpeed);
      const requestedParticleSize = Number(props.barParticleSize);
      const particleSizeScale = Number.isFinite(requestedParticleSize)
        ? Math.max(0, Math.min(200, requestedParticleSize)) / 100
        : 1;
      const requestedGlowSize = Number(props.barGlowSize);
      const glowScale = Number.isFinite(requestedGlowSize)
        ? Math.max(0, Math.min(200, requestedGlowSize)) / 100
        : 1;
      const playingRef = useRef(!!props.playing);
      const particleColorRef = useRef(props.barParticleColor || props.barColor);
      const particleSizeRef = useRef(particleSizeScale);
      const particleStartRef = useRef(null);
      maxBarRef.current = props.maxBarHeight;
      speedRef.current = props.barSpeed;
      playingRef.current = !!props.playing;
      particleColorRef.current = props.barParticleColor || props.barColor;
      particleSizeRef.current = particleSizeScale;
      const requestedOpacity = Number(props.barOpacity);
      const barOpacity = Number.isFinite(requestedOpacity)
        ? Math.max(0, Math.min(100, requestedOpacity)) / 100
        : 0.64;

      useEffect(() => {
        const container = containerRef.current;
        if (!container) return undefined;
        const barsLayer = container.querySelector('.dsh-music-bars');
        const bars = Array.from(container.querySelectorAll('.dsh-music-bar'));
        if (!barsLayer || !bars.length) return undefined;

        const barCount = bars.length;
        const levels = new Float32Array(barCount);
        let frame = 0;
        let disposed = false;
        let bassLevel = 0;

        const setArtScale = (level) => {
          const art = props.artRef && props.artRef.current;
          if (!art) return;
          if (level > 0.01) {
            art.style.setProperty('--dsh-music-art-scale', (1 + level * 0.06).toFixed(3));
          } else {
            art.style.removeProperty('--dsh-music-art-scale');
          }
        };

        const paint = (idle) => {
          const requestedMax = Number(maxBarRef.current);
          const maxBarPx = Number.isFinite(requestedMax)
            ? Math.max(0, Math.min(300, requestedMax))
            : 200;
          const heightCss = maxBarPx + 'px';
          const bounce = idle || maxBarPx <= 0 ? 0 : bassLevel * 18;
          if (bounce > 0.05) {
            barsLayer.style.transform = 'translateY(-' + bounce.toFixed(2) + 'px)';
          } else {
            barsLayer.style.transform = '';
          }
          for (let index = 0; index < barCount; index += 1) {
            if (bars[index].style.height !== heightCss) {
              bars[index].style.height = heightCss;
            }
            const scale =
              maxBarPx <= 0
                ? 0
                : idle
                  ? 0.05
                  : 0.05 + Math.min(1, Math.max(0, levels[index])) * 0.95;
            bars[index].style.transform = 'scaleY(' + scale.toFixed(3) + ')';
          }
        };

        const tick = () => {
          if (disposed) return;
          frame = requestAnimationFrame(tick);
          const rawSpeed = Number(speedRef.current);
          const easing = Number.isFinite(rawSpeed)
            ? Math.max(0.1, Math.min(1, rawSpeed / 100))
            : 0.35;
          const data = props.player.readFrequencyData();
          if (!data) {
            bassLevel += (0 - bassLevel) * easing;
            for (let index = 0; index < barCount; index += 1) {
              levels[index] += (0 - levels[index]) * easing;
            }
            setArtScale(bassLevel);
            paint(true);
            return;
          }
          const bins = data.length;
          const usableBins = Math.min(bins, 32);
          const bassBins = Math.min(6, usableBins);
          let bassSum = 0;
          for (let bin = 0; bin < bassBins; bin += 1) bassSum += data[bin];
          const bassAverage = bassSum / bassBins / 255;
          const bassTarget = Math.min(1, Math.pow(bassAverage, 0.7) * 1.4);
          bassLevel += (bassTarget - bassLevel) * easing;
          for (let index = 0; index < barCount; index += 1) {
            const start = Math.floor((index * usableBins) / barCount);
            const end = Math.max(start + 1, Math.floor(((index + 1) * usableBins) / barCount));
            let sum = 0;
            for (let bin = start; bin < end; bin += 1) sum += data[bin];
            const average = sum / (end - start) / 255;
            const target = Math.min(1, Math.pow(average, 1.45) * 1.35);
            levels[index] += (target - levels[index]) * easing;
          }
          setArtScale(bassLevel);
          paint(false);
        };

        paintRef.current = paint;
        setArtScale(0);
        paint(true);
        if (props.playing) frame = requestAnimationFrame(tick);

        return () => {
          disposed = true;
          paintRef.current = null;
          cancelAnimationFrame(frame);
          setArtScale(0);
          barsLayer.style.transform = '';
          for (let index = 0; index < bars.length; index += 1) {
            bars[index].style.transform = 'scaleY(0.05)';
          }
        };
      }, [props.player, props.artRef, props.playing, props.trackId]);

      useEffect(() => {
        if (paintRef.current) paintRef.current(!props.playing);
      }, [props.maxBarHeight]);

      useEffect(() => {
        const container = containerRef.current;
        if (!container) return undefined;
        const canvas = container.querySelector('.dsh-music-bar-particles');
        const barsLayer = container.querySelector('.dsh-music-bars');
        const bars = Array.from(container.querySelectorAll('.dsh-music-bar'));
        if (!canvas || !barsLayer || !bars.length) return undefined;
        const context = canvas.getContext('2d');
        if (!context) return undefined;

        const barCount = bars.length;
        const barAllocation = particleAllocation(props.particleCount);
        const barCounts = Array.from({ length: barCount }, (_, index) =>
          barAllocation.barBase + (index < barAllocation.barExtra ? 1 : 0)
        );
        const barParticleTotal = barCounts.reduce((sum, value) => sum + value, 0);
        let width = 0;
        let height = 0;
        let dpr = 1;
        let positions = [];
        let particles = [];
        let frame = 0;
        let running = false;
        let last = 0;
        let intensity = 0;

        const measure = () => {
          const rect = container.getBoundingClientRect();
          const nextWidth = Math.max(1, Math.floor(rect.width));
          const nextHeight = Math.max(1, Math.floor(rect.height));
          const nextDpr = Math.min(2, window.devicePixelRatio || 1);
          if (nextWidth !== width || nextHeight !== height || nextDpr !== dpr) {
            width = nextWidth;
            height = nextHeight;
            dpr = nextDpr;
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            context.setTransform(dpr, 0, 0, dpr, 0, 0);
          }
          positions = bars.map((bar) => {
            const barRect = bar.getBoundingClientRect();
            return {
              x: barRect.left - rect.left + barRect.width / 2,
              width: barRect.width
            };
          });
        };

        const getColor = () => {
          const raw = String(particleColorRef.current || '').replace('#', '');
          if (!/^[0-9a-f]{6}$/i.test(raw)) return { r: 79, g: 140, b: 255 };
          return {
            r: parseInt(raw.slice(0, 2), 16),
            g: parseInt(raw.slice(2, 4), 16),
            b: parseInt(raw.slice(4, 6), 16)
          };
        };

        const getFrames = () => {
          const rect = container.getBoundingClientRect();
          const layerRect = barsLayer.getBoundingClientRect();
          return bars.map((bar, index) => {
            const styleHeight = parseFloat(bar.style.height) || 0;
            const match = String(bar.style.transform || '').match(/scaleY\(([^)]+)\)/);
            const scale = match ? parseFloat(match[1]) : 0.05;
            const visibleHeight =
              styleHeight * (Number.isFinite(scale) ? Math.max(0, scale) : 0.05);
            const position = positions[index] || { x: 0, width: 0 };
            return {
              x: position.x,
              width: position.width,
              top: layerRect.bottom - rect.top - visibleHeight,
              height: visibleHeight
            };
          });
        };

        const makeParticle = (barIndex, seeded, frames) => {
          const barFrame = frames[barIndex] || {
            x: width / 2,
            width: 2,
            top: height,
            height: 0
          };
          const side = Math.random() < 0.5 ? -1 : 1;
          const maxLife = 1.2 + Math.random() * 1.8;
          return {
            bar: barIndex,
            x:
              barFrame.x +
              side * (Math.max(1, barFrame.width * 0.45) + Math.random() * 8),
            y:
              barFrame.top +
              Math.random() * Math.min(18, Math.max(2, barFrame.height * 0.35)),
            vx: side * (0.06 + Math.random() * 0.35),
            vy: -(0.05 + Math.random() * 0.32),
            life: seeded ? Math.random() * maxLife : 0,
            maxLife,
            size: (0.5 + Math.random() * 1.5) * particleSizeRef.current,
            alphaScale: 0.3 + Math.random() * 0.5
          };
        };

        const seed = () => {
          const frames = getFrames();
          particles = [];
          for (let barIndex = 0; barIndex < barCount; barIndex += 1) {
            const count = barCounts[barIndex];
            for (let particleIndex = 0; particleIndex < count; particleIndex += 1) {
              particles.push(makeParticle(barIndex, true, frames));
            }
          }
        };

        const tick = (now) => {
          if (!last) last = now;
          const dt = Math.min(0.05, (now - last) / 1000);
          last = now;
          const playing = playingRef.current;
          intensity += ((playing ? 1 : 0) - intensity) * (playing ? 0.08 : 0.04);
          const frames = getFrames();
          const color = getColor();
          context.clearRect(0, 0, width, height);
          context.globalCompositeOperation = 'lighter';
          let visible = false;

          for (let index = 0; index < particles.length; index += 1) {
            const particle = particles[index];
            if (playing) {
              particle.life += dt;
              particle.x += particle.vx * dt * 60;
              particle.y += particle.vy * dt * 60;
              particle.vx += (Math.random() - 0.5) * 0.002;
              particle.vy -= 0.001;
              if (particle.life >= particle.maxLife) {
                particles[index] = makeParticle(particle.bar, false, frames);
                continue;
              }
            } else {
              const damping = Math.pow(0.98, dt * 60);
              particle.vx *= damping;
              particle.vy *= damping;
              particle.x += particle.vx * dt * 60;
              particle.y += particle.vy * dt * 60;
              particle.life += dt * 0.35;
              if (particle.life >= particle.maxLife) particle.life = particle.maxLife;
            }

            const phase = Math.min(1, Math.max(0, particle.life / particle.maxLife));
            const alpha = Math.max(
              0,
              Math.min(
                1,
                Math.sin(Math.PI * phase) * particle.alphaScale * intensity
              )
            );
            if (alpha <= 0.004) continue;
            visible = true;
            const tint =
              'rgba(' + color.r + ',' + color.g + ',' + color.b + ',';
            context.fillStyle = tint + (alpha * 0.12).toFixed(3) + ')';
            context.beginPath();
            context.arc(particle.x, particle.y, particle.size * 2.8, 0, Math.PI * 2);
            context.fill();
            context.fillStyle = tint + alpha.toFixed(3) + ')';
            context.beginPath();
            context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            context.fill();
          }

          if (playing || intensity > 0.01 || visible) {
            frame = requestAnimationFrame(tick);
          } else {
            running = false;
            frame = 0;
          }
        };

        const start = () => {
          if (running) return;
          seed();
          running = true;
          last = 0;
          frame = requestAnimationFrame(tick);
        };

        particleStartRef.current = start;
        measure();
        seed();
        if (playingRef.current && barParticleTotal > 0) start();

        let observer = null;
        if (typeof ResizeObserver === 'function') {
          observer = new ResizeObserver(() => {
            measure();
            seed();
          });
          observer.observe(container);
        }
        const onWindowResize = () => {
          measure();
          seed();
        };
        window.addEventListener('resize', onWindowResize);

        return () => {
          if (observer) observer.disconnect();
          window.removeEventListener('resize', onWindowResize);
          if (frame) cancelAnimationFrame(frame);
          frame = 0;
          running = false;
          particleStartRef.current = null;
          context.clearRect(0, 0, width, height);
          particles = [];
        };
      }, [props.particleCount]);

      useEffect(() => {
        const allocation = particleAllocation(props.particleCount);
        if (
          props.playing &&
          allocation.barBase * 32 + allocation.barExtra > 0 &&
          particleStartRef.current
        ) {
          particleStartRef.current();
        }
      }, [props.playing, props.particleCount]);

      return h(
        'div',
        {
          className:
            'dsh-music-visualizer' +
            (props.variant === 'workspace'
              ? ' is-workspace'
              : props.variant === 'workspace-backdrop'
                ? ' is-workspace-backdrop'
                : props.variant === 'player-backdrop'
                  ? ' is-player-backdrop'
                  : ''),
          'aria-hidden': true,
          ref: containerRef,
          style: {
            '--dsh-music-bar-color': props.barColor || '#4f8cff',
            '--dsh-music-bar-opacity': String(barOpacity),
            '--dsh-music-bar-glow-small': (5 * glowScale).toFixed(2) + 'px',
            '--dsh-music-bar-glow-large': (16 * glowScale).toFixed(2) + 'px',
            '--dsh-music-bar-glow-color':
              props.barGlowColor || props.barColor || '#4f8cff'
          }
        },
        h(
          'div',
          { className: 'dsh-music-bars' },
          Array.from({ length: 32 }, (_, index) =>
            h('span', { key: index, className: 'dsh-music-bar' })
          )
        ),
        h('canvas', {
          className: 'dsh-music-bar-particles',
          'aria-hidden': true
        })
      );
    }

    function WorkspaceSpectrum(props) {
      const snapshot = useSettingsStore(props.settingsStore);
      const settings = snapshot.settings;
      const state = usePlayerSelector(props.player, selectPanelState, shallowEqual);
      if (!settings.workspaceSpectrumEnabled) return null;

      const current = state.tracks.find((track) => track.id === state.currentId) || null;
      if (!current) return null;

      const requestedMax = Number(settings.maxBarHeight);
      const workspaceMax = Number.isFinite(requestedMax)
        ? Math.max(0, Math.min(180, requestedMax))
        : 180;
      return h(Spectrum, {
        player: props.player,
        maxBarHeight: workspaceMax,
        barSpeed: settings.barSpeed,
        barOpacity: settings.barOpacity,
        barColor: settings.barColor,
        barParticleSize: settings.barParticleSize,
        barParticleColor: settings.barParticleColor,
        barGlowSize: settings.barGlowSize,
        barGlowColor: settings.barGlowColor,
        particleCount: settings.particleCount,
        playing: state.playing,
        trackId: current.id,
        variant: 'workspace'
      });
    }

    function WorkspaceBackdrop(props) {
      const anchorRef = useRef(null);
      const [target, setTarget] = useState(null);
      const syncRef = useRef(null);
      const snapshot = useSettingsStore(props.settingsStore);
      const settings = snapshot.settings;
      const placementRef = useRef(
        settings.workspaceBarsPlacement === 'bottom' ? 'bottom' : 'aboveInput'
      );
      placementRef.current =
        settings.workspaceBarsPlacement === 'bottom' ? 'bottom' : 'aboveInput';
      const state = usePlayerSelector(props.player, selectPanelState, shallowEqual);
      const current = state.tracks.find((track) => track.id === state.currentId) || null;
      const enabled = !!settings.workspaceSpectrumEnabled && !!current;

      useEffect(() => {
        if (!createPortal || !enabled) {
          setTarget(null);
          return undefined;
        }
        const anchor = anchorRef.current;
        const body = anchor && anchor.closest('[data-conversation-content]');
        if (!body) return undefined;

        const layer = document.createElement('div');
        layer.className = 'dsh-music-workspace-layer';
        const previousIsolation = body.style.isolation;
        body.style.isolation = 'isolate';
        body.insertBefore(layer, body.firstChild);
        const seat = anchor.closest('[data-composer-seat]');
        const sync = () => {
          const bodyRect = body.getBoundingClientRect();
          const seatRect = seat ? seat.getBoundingClientRect() : null;
          const bottom =
            placementRef.current === 'bottom'
              ? 0
              : seatRect
                ? Math.min(bodyRect.height, Math.max(0, bodyRect.bottom - seatRect.top))
                : 0;
          layer.style.setProperty('--dsh-music-workspace-bottom', bottom + 'px');
        };
        syncRef.current = sync;
        sync();
        let observer = null;
        if (typeof ResizeObserver !== 'undefined') {
          observer = new ResizeObserver(sync);
          observer.observe(body);
          if (seat) observer.observe(seat);
        }
        window.addEventListener('resize', sync);
        setTarget(layer);

        return () => {
          if (observer) observer.disconnect();
          window.removeEventListener('resize', sync);
          syncRef.current = null;
          setTarget(null);
          layer.remove();
          body.style.isolation = previousIsolation;
        };
      }, [enabled, current ? current.id : '', props.player, props.settingsStore]);

      useEffect(() => {
        if (syncRef.current) syncRef.current();
      }, [settings.workspaceBarsPlacement, target]);

      if (!createPortal) return h(WorkspaceSpectrum, props);

      const requestedMax = Number(settings.maxBarHeight);
      const workspaceMax = Number.isFinite(requestedMax)
        ? Math.max(0, Math.min(180, requestedMax))
        : 180;
      return h(
        React.Fragment,
        null,
        h('span', { ref: anchorRef, style: { display: 'none' }, 'aria-hidden': true }),
        target && enabled
          ? createPortal(
              h(Spectrum, {
                player: props.player,
                maxBarHeight: workspaceMax,
                barSpeed: settings.barSpeed,
                barOpacity: settings.barOpacity,
                barColor: settings.barColor,
                barParticleSize: settings.barParticleSize,
                barParticleColor: settings.barParticleColor,
                barGlowSize: settings.barGlowSize,
                barGlowColor: settings.barGlowColor,
                particleCount: settings.particleCount,
                playing: state.playing,
                trackId: current.id,
                variant: 'workspace-backdrop'
              }),
              target
            )
          : null
      );
    }

    function SettingsOverlay(props) {
      const t = props.t;
      const settings = props.settings;
      const onChange = props.onChange;
      const shortcuts = settings.shortcuts || DEFAULT_SETTINGS.shortcuts;
      const [capturing, setCapturing] = useState(null);
      const [captureError, setCaptureError] = useState('');
      const [resetConfirm, setResetConfirm] = useState(false);
      const [page, setPage] = useState('main');
      const [labelBusy, setLabelBusy] = useState(false);
      const [labelError, setLabelError] = useState('');
      const panelRef = useRef(null);
      const labelInputRef = useRef(null);
      const presets = ['#4f8cff', '#a855f7', '#22c55e', '#f59e0b', '#ef4444', '#ec4899'];
      const isDefault = (key) => settings[key] === DEFAULT_SETTINGS[key];
      const resetSetting = (key) => {
        const value = DEFAULT_SETTINGS[key];
        onChange({
          [key]:
            value && typeof value === 'object' ? Object.assign({}, value) : value
        });
      };
      const resetShortcut = (action) => {
        setCapturing(null);
        setCaptureError('');
        const current = settings.shortcuts || DEFAULT_SETTINGS.shortcuts;
        const target = DEFAULT_SETTINGS.shortcuts[action];
        if (current[action] === target) return;
        const next = Object.assign({}, current);
        for (let index = 0; index < SHORTCUT_ACTIONS.length; index += 1) {
          const other = SHORTCUT_ACTIONS[index];
          if (other !== action && next[other] === target) {
            next[other] = current[action];
          }
        }
        next[action] = target;
        onChange({ shortcuts: next });
      };
      const goPage = (nextPage) => {
        setCapturing(null);
        setCaptureError('');
        setPage(nextPage);
      };
      const handleLabelFile = (event) => {
        const input = event.target;
        const file = input.files && input.files[0];
        input.value = '';
        if (!file) return;
        if (!file.type || file.type.indexOf('image/') !== 0) {
          setLabelError(t('labelImageInvalid'));
          return;
        }
        if (file.size > 25 * 1024 * 1024) {
          setLabelError(t('labelImageInvalid'));
          return;
        }
        setLabelError('');
        setLabelBusy(true);
        const reader = new FileReader();
        reader.onerror = () => {
          setLabelBusy(false);
          setLabelError(t('labelImageInvalid'));
        };
        reader.onload = () => {
          const image = new Image();
          image.onerror = () => {
            setLabelBusy(false);
            setLabelError(t('labelImageInvalid'));
          };
          image.onload = () => {
            try {
              const width = image.naturalWidth || image.width;
              const height = image.naturalHeight || image.height;
              if (!width || !height) throw new Error('empty image');
              const side = Math.min(width, height);
              const size = 512;
              const canvas = document.createElement('canvas');
              canvas.width = size;
              canvas.height = size;
              const context = canvas.getContext('2d');
              if (!context) throw new Error('canvas unavailable');
              context.fillStyle = '#ffffff';
              context.fillRect(0, 0, size, size);
              context.drawImage(
                image,
                (width - side) / 2,
                (height - side) / 2,
                side,
                side,
                0,
                0,
                size,
                size
              );
              onChange({ labelImage: canvas.toDataURL('image/jpeg', 0.9) });
              setLabelError('');
            } catch (error) {
              setLabelError(t('labelImageInvalid'));
            }
            setLabelBusy(false);
          };
          image.src = String(reader.result || '');
        };
        reader.readAsDataURL(file);
      };

      useEffect(() => {
        if (panelRef.current) panelRef.current.focus();
      }, []);

      useEffect(() => {
        if (!capturing) return undefined;
        const onKeyDown = (event) => {
          event.preventDefault();
          event.stopImmediatePropagation();
          if (event.repeat || event.isComposing) return;
          if (event.key === 'Escape') {
            setCapturing(null);
            setCaptureError('');
            return;
          }
          const code = event.code || '';
          if (/^(Shift|Control|Alt|Meta|OS)/.test(code)) return;
          if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
            setCaptureError(t('shortcutInvalid'));
            return;
          }
          const nextCode = shortcutCodeFromEvent(event);
          if (!nextCode) {
            setCaptureError(t('shortcutInvalid'));
            return;
          }
          const previousCode =
            shortcuts[capturing] || DEFAULT_SETTINGS.shortcuts[capturing];
          const next = Object.assign({}, shortcuts);
          for (let index = 0; index < SHORTCUT_ACTIONS.length; index += 1) {
            const action = SHORTCUT_ACTIONS[index];
            if (action !== capturing && next[action] === nextCode) {
              next[action] = previousCode;
            }
          }
          next[capturing] = nextCode;
          onChange({ shortcuts: next });
          setCapturing(null);
          setCaptureError('');
        };
        window.addEventListener('keydown', onKeyDown, true);
        return () => window.removeEventListener('keydown', onKeyDown, true);
      }, [capturing, shortcuts, onChange, t]);

      const beginCapture = (action) => {
        setCaptureError('');
        setCapturing((previous) => (previous === action ? null : action));
      };

      return h(
        'div',
        {
          className: 'dsh-music-settings-backdrop',
          role: 'presentation',
          onClick: props.onClose
        },
        h(
          'div',
          {
            ref: panelRef,
            tabIndex: -1,
            className: 'dsh-music-settings-panel',
            role: 'dialog',
            'aria-modal': 'true',
            'aria-label': t('settingsTitle'),
            onClick: (event) => event.stopPropagation()
          },
          h(
            'div',
            { className: 'dsh-music-settings-head' },
            h(
              'div',
              { className: 'dsh-music-settings-heading' },
              h('div', { className: 'dsh-music-settings-title' }, t('settingsTitle')),
              h('div', { className: 'dsh-music-settings-sub' }, t('settingsHint'))
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'dsh-music-settings-close',
                title: t('close'),
                'aria-label': t('close'),
                onClick: props.onClose
              },
              h(IconClose, { size: 16 })
            )
          ),
          h(
            'div',
            { className: 'dsh-music-settings-tabs', role: 'tablist' },
            h(
              'button',
              {
                type: 'button',
                role: 'tab',
                className:
                  'dsh-music-settings-tab' + (page === 'main' ? ' is-active' : ''),
                'aria-selected': page === 'main',
                onClick: () => goPage('main')
              },
              t('settingsGeneral')
            ),
            h(
              'button',
              {
                type: 'button',
                role: 'tab',
                className:
                  'dsh-music-settings-tab' + (page === 'vinyl' ? ' is-active' : ''),
                'aria-selected': page === 'vinyl',
                onClick: () => goPage('vinyl')
              },
              t('vinylOptions')
            ),
            h(
              'button',
              {
                type: 'button',
                role: 'tab',
                className:
                  'dsh-music-settings-tab' + (page === 'effects' ? ' is-active' : ''),
                'aria-selected': page === 'effects',
                onClick: () => goPage('effects')
              },
              t('effectsOptions')
            )
          ),
          h(
            'div',
            {
              className:
                'dsh-music-settings-page' + (page === 'main' ? '' : ' is-hidden')
            },
          h(
            'div',
            { className: 'dsh-music-settings-row' },
            h(
              'div',
              { className: 'dsh-music-settings-copy' },
              h('div', { className: 'dsh-music-settings-label' }, t('spectrumEnabled')),
              h('div', { className: 'dsh-music-settings-note' }, t('spectrumEnabledHint'))
            ),
            h(
              'div',
              { className: 'dsh-music-settings-controls' },
              h(
                'label',
                { className: 'dsh-music-switch' },
                h('input', {
                  type: 'checkbox',
                  checked: settings.spectrumEnabled,
                  'aria-label': t('spectrumEnabled'),
                  onChange: (event) => onChange({ spectrumEnabled: event.target.checked })
                }),
                h('span', { className: 'dsh-music-switch-track', 'aria-hidden': true })
              ),
              h(SettingReset, {
                t,
                disabled: isDefault('spectrumEnabled'),
                onClick: () => resetSetting('spectrumEnabled')
              })
            )
          ),
          h(
            'div',
            { className: 'dsh-music-settings-row' },
            h(
              'div',
              { className: 'dsh-music-settings-copy' },
              h('div', { className: 'dsh-music-settings-label' }, t('workspaceSpectrumEnabled')),
              h('div', { className: 'dsh-music-settings-note' }, t('workspaceSpectrumEnabledHint'))
            ),
            h(
              'div',
              { className: 'dsh-music-settings-controls' },
              h(
                'label',
                { className: 'dsh-music-switch' },
                h('input', {
                  type: 'checkbox',
                  checked: settings.workspaceSpectrumEnabled,
                  'aria-label': t('workspaceSpectrumEnabled'),
                  onChange: (event) =>
                    onChange({ workspaceSpectrumEnabled: event.target.checked })
                }),
                h('span', { className: 'dsh-music-switch-track', 'aria-hidden': true })
              ),
              h(SettingReset, {
                t,
                disabled: isDefault('workspaceSpectrumEnabled'),
                onClick: () => resetSetting('workspaceSpectrumEnabled')
              })
            )
          ),
          h(
            'div',
            { className: 'dsh-music-settings-row is-select' },
            h(
              'div',
              { className: 'dsh-music-settings-copy' },
              h('div', { className: 'dsh-music-settings-label' }, t('workspaceBarsPlacement')),
              h('div', { className: 'dsh-music-settings-note' }, t('workspaceBarsPlacementHint'))
            ),
            h(
              'div',
              { className: 'dsh-music-settings-controls' },
              h(
                'select',
                {
                  className: 'dsh-music-settings-select',
                  value: settings.workspaceBarsPlacement,
                  'aria-label': t('workspaceBarsPlacement'),
                  onChange: (event) =>
                    onChange({ workspaceBarsPlacement: event.target.value })
                },
                h('option', { value: 'aboveInput' }, t('placementAboveInput')),
                h('option', { value: 'bottom' }, t('placementBottom'))
              ),
              h(SettingReset, {
                t,
                disabled: isDefault('workspaceBarsPlacement'),
                onClick: () => resetSetting('workspaceBarsPlacement')
              })
            )
          ),
          h(
            'div',
            { className: 'dsh-music-settings-row is-column' },
            h(
              'div',
              { className: 'dsh-music-settings-row-head' },
              h(
                'div',
                { className: 'dsh-music-settings-copy' },
                h('div', { className: 'dsh-music-settings-label' }, t('maxBarHeight')),
                h('div', { className: 'dsh-music-settings-note' }, settings.maxBarHeight + ' px')
              ),
              h(SettingReset, {
                t,
                disabled: isDefault('maxBarHeight'),
                onClick: () => resetSetting('maxBarHeight')
              })
            ),
            h('input', {
              type: 'range',
              min: 0,
              max: 300,
              step: 1,
              value: settings.maxBarHeight,
              'aria-label': t('maxBarHeight'),
              onChange: (event) => onChange({ maxBarHeight: Number(event.target.value) })
            }),
            h(
              'div',
              { className: 'dsh-music-settings-scale' },
              h('span', null, '0'),
              h('span', null, '300')
            )
          ),
          h(
            'div',
            { className: 'dsh-music-settings-row is-column' },
            h(
              'div',
              { className: 'dsh-music-settings-row-head' },
              h(
                'div',
                { className: 'dsh-music-settings-copy' },
                h('div', { className: 'dsh-music-settings-label' }, t('barSpeed')),
                h('div', { className: 'dsh-music-settings-note' }, settings.barSpeed + ' / 100')
              ),
              h(SettingReset, {
                t,
                disabled: isDefault('barSpeed'),
                onClick: () => resetSetting('barSpeed')
              })
            ),
            h('input', {
              type: 'range',
              min: 10,
              max: 100,
              step: 1,
              value: settings.barSpeed,
              'aria-label': t('barSpeed'),
              onChange: (event) => onChange({ barSpeed: Number(event.target.value) })
            }),
            h(
              'div',
              { className: 'dsh-music-settings-scale' },
              h('span', null, '10'),
              h('span', null, '100')
            ),
            h('div', { className: 'dsh-music-settings-note' }, t('barSpeedHint'))
          ),
          h(
            'div',
            { className: 'dsh-music-settings-row is-column' },
            h(
              'div',
              { className: 'dsh-music-settings-row-head' },
              h(
                'div',
                { className: 'dsh-music-settings-copy' },
                h('div', { className: 'dsh-music-settings-label' }, t('barOpacity')),
                h('div', { className: 'dsh-music-settings-note' }, settings.barOpacity + '%')
              ),
              h(SettingReset, {
                t,
                disabled: isDefault('barOpacity'),
                onClick: () => resetSetting('barOpacity')
              })
            ),
            h('input', {
              type: 'range',
              min: 0,
              max: 100,
              step: 1,
              value: settings.barOpacity,
              'aria-label': t('barOpacity'),
              onChange: (event) => onChange({ barOpacity: Number(event.target.value) })
            }),
            h(
              'div',
              { className: 'dsh-music-settings-scale' },
              h('span', null, '0'),
              h('span', null, '100')
            ),
            h('div', { className: 'dsh-music-settings-note' }, t('barOpacityHint'))
          ),
          h(
            'div',
            { className: 'dsh-music-settings-row is-column' },
            h(
              'div',
              { className: 'dsh-music-settings-row-head' },
              h(
                'div',
                { className: 'dsh-music-settings-copy' },
                h('div', { className: 'dsh-music-settings-label' }, t('cardOpacity')),
                h('div', { className: 'dsh-music-settings-note' }, settings.cardOpacity + '%')
              ),
              h(SettingReset, {
                t,
                disabled: isDefault('cardOpacity'),
                onClick: () => resetSetting('cardOpacity')
              })
            ),
            h('input', {
              type: 'range',
              min: 0,
              max: 100,
              step: 1,
              value: settings.cardOpacity,
              'aria-label': t('cardOpacity'),
              onChange: (event) => onChange({ cardOpacity: Number(event.target.value) })
            }),
            h(
              'div',
              { className: 'dsh-music-settings-scale' },
              h('span', null, '0'),
              h('span', null, '100')
            ),
            h('div', { className: 'dsh-music-settings-note' }, t('cardOpacityHint'))
          ),
          h(
            'div',
            { className: 'dsh-music-settings-row is-column' },
            h(
              'div',
              { className: 'dsh-music-settings-copy' },
              h('div', { className: 'dsh-music-settings-label' }, t('playerTextColor')),
              h(
                'div',
                { className: 'dsh-music-settings-note' },
                settings.playerTextColor
                  ? settings.playerTextColor.toUpperCase()
                  : t('followTheme')
              )
            ),
            h(
              'div',
              { className: 'dsh-music-color-row' },
              h('input', {
                type: 'color',
                value: settings.playerTextColor || '#e6edf7',
                'aria-label': t('playerTextColor'),
                onChange: (event) =>
                  onChange({ playerTextColor: event.target.value })
              }),
              h(
                'button',
                {
                  type: 'button',
                  className: 'dsh-music-text-reset',
                  disabled: !settings.playerTextColor,
                  title: t('resetSettingTitle'),
                  'aria-label': t('followTheme'),
                  onClick: () => onChange({ playerTextColor: '' })
                },
                t('followTheme')
              )
            ),
            h('div', { className: 'dsh-music-settings-note' }, t('playerTextColorHint'))
          ),
          h(
            'div',
            { className: 'dsh-music-settings-row is-column' },
            h(
              'div',
              { className: 'dsh-music-settings-copy' },
              h('div', { className: 'dsh-music-settings-label' }, t('barColor')),
              h('div', { className: 'dsh-music-settings-note' }, settings.barColor.toUpperCase())
            ),
            h(
              'div',
              { className: 'dsh-music-color-row' },
              h('input', {
                type: 'color',
                value: settings.barColor,
                'aria-label': t('barColor'),
                onChange: (event) => onChange({ barColor: event.target.value })
              }),
              h(
                'div',
                { className: 'dsh-music-presets', 'aria-label': t('presets') },
                presets.map((color) =>
                  h('button', {
                    key: color,
                    type: 'button',
                    className:
                      'dsh-music-swatch' +
                      (settings.barColor.toLowerCase() === color ? ' is-active' : ''),
                    style: { backgroundColor: color },
                    title: color,
                    'aria-label': color,
                    onClick: () => onChange({ barColor: color })
                  })
                )
              ),
              h(SettingReset, {
                t,
                disabled: isDefault('barColor'),
                onClick: () => resetSetting('barColor')
              })
            )
          ),
          h(
            'div',
            { className: 'dsh-music-settings-row is-column' },
            h(
              'div',
              { className: 'dsh-music-settings-copy' },
              h('div', { className: 'dsh-music-settings-label' }, t('shortcutsSection')),
              h('div', { className: 'dsh-music-settings-note' }, t('shortcutsHint'))
            ),
            h(
              'div',
              { className: 'dsh-music-shortcut-list' },
              [
                ['playPause', 'shortcutPlayPause'],
                ['previous', 'shortcutPrevious'],
                ['next', 'shortcutNext']
              ].map((item) =>
                h(
                  'div',
                  { className: 'dsh-music-shortcut-row', key: item[0] },
                  h('span', { className: 'dsh-music-shortcut-name' }, t(item[1])),
                  h(
                    'button',
                    {
                      type: 'button',
                      className:
                        'dsh-music-shortcut-key' +
                        (capturing === item[0] ? ' is-capturing' : ''),
                      title: t('shortcutsHint'),
                      'aria-label': t(item[1]),
                      onClick: () => beginCapture(item[0])
                    },
                    capturing === item[0]
                      ? t('pressKey')
                      : shortcutLabel(shortcuts[item[0]])
                  ),
                  h(SettingReset, {
                    t,
                    disabled:
                      (settings.shortcuts || DEFAULT_SETTINGS.shortcuts)[item[0]] ===
                      DEFAULT_SETTINGS.shortcuts[item[0]],
                    onClick: () => resetShortcut(item[0])
                  })
                )
              )
            ),
            captureError
              ? h(
                  'div',
                  { className: 'dsh-music-shortcut-error', role: 'alert' },
                  captureError
                )
              : null
          ),
          h(
            'div',
            { className: 'dsh-music-settings-reset' },
            h(
              'div',
              { className: 'dsh-music-settings-reset-copy' },
              h(
                'div',
                { className: 'dsh-music-settings-label' },
                resetConfirm ? t('resetConfirm') : t('resetAll')
              ),
              h('div', { className: 'dsh-music-settings-note' }, t('resetAllHint'))
            ),
            resetConfirm
              ? h(
                  'div',
                  { className: 'dsh-music-settings-reset-actions' },
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'dsh-music-reset-confirm',
                      onClick: () => {
                        setCapturing(null);
                        setCaptureError('');
                        props.onReset();
                        setResetConfirm(false);
                      }
                    },
                    t('resetConfirmAction')
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'dsh-music-reset-cancel',
                      onClick: () => setResetConfirm(false)
                    },
                    t('cancel')
                  )
                )
              : h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-music-reset-btn',
                    onClick: () => {
                      setCapturing(null);
                      setCaptureError('');
                      setResetConfirm(true);
                    }
                  },
                  t('resetAll')
                )
          ),
          ),
          h(
            'div',
            {
              className:
                'dsh-music-settings-page' + (page === 'vinyl' ? '' : ' is-hidden')
            },
            h(
              'div',
              { className: 'dsh-music-settings-page-head' },
              h('div', { className: 'dsh-music-settings-title' }, t('vinylOptions')),
              h('div', { className: 'dsh-music-settings-sub' }, t('vinylOptionsHint'))
            ),
            h(
              'div',
              { className: 'dsh-music-settings-row is-column' },
              h(
                'div',
                { className: 'dsh-music-settings-row-head' },
                h(
                  'div',
                  { className: 'dsh-music-settings-copy' },
                  h('div', { className: 'dsh-music-settings-label' }, t('vinylLabelImage')),
                  h(
                    'div',
                    { className: 'dsh-music-settings-note' },
                    settings.labelImage ? t('vinylLabelCustom') : t('vinylLabelDefault')
                  )
                ),
                h(SettingReset, {
                  t,
                  disabled: !settings.labelImage,
                  onClick: () => onChange({ labelImage: '' })
                })
              ),
              h(
                'div',
                { className: 'dsh-music-label-editor' },
                h('img', {
                  className: 'dsh-music-label-preview',
                  src: settings.labelImage || DEFAULT_VINYL_LABEL_IMAGE,
                  alt: ''
                }),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-music-label-select',
                    disabled: labelBusy,
                    onClick: () => {
                      if (labelInputRef.current) labelInputRef.current.click();
                    }
                  },
                  labelBusy ? t('processingImage') : t('chooseImage')
                ),
                h('input', {
                  ref: labelInputRef,
                  type: 'file',
                  accept: 'image/*',
                  style: { display: 'none' },
                  onChange: handleLabelFile
                })
              ),
              h('div', { className: 'dsh-music-settings-note' }, t('vinylLabelImageHint')),
              labelError
                ? h(
                    'div',
                    { className: 'dsh-music-label-error', role: 'alert' },
                    labelError
                  )
                : null
            ),
            h(
              'div',
              { className: 'dsh-music-settings-row is-column' },
              h(
                'div',
                { className: 'dsh-music-settings-row-head' },
                h(
                  'div',
                  { className: 'dsh-music-settings-copy' },
                  h('div', { className: 'dsh-music-settings-label' }, t('vinylColor')),
                  h(
                    'div',
                    { className: 'dsh-music-settings-note' },
                    settings.vinylColor.toUpperCase()
                  )
                ),
                h(SettingReset, {
                  t,
                  disabled: isDefault('vinylColor'),
                  onClick: () => resetSetting('vinylColor')
                })
              ),
              h(
                'div',
                { className: 'dsh-music-color-row' },
                h('input', {
                  type: 'color',
                  value: settings.vinylColor,
                  'aria-label': t('vinylColor'),
                  onChange: (event) => onChange({ vinylColor: event.target.value })
                })
              ),
              h('div', { className: 'dsh-music-settings-note' }, t('vinylColorHint'))
            )
          ),
          h(
            'div',
            {
              className:
                'dsh-music-settings-page' + (page === 'effects' ? '' : ' is-hidden')
            },
            h(
              'div',
              { className: 'dsh-music-settings-page-head' },
              h('div', { className: 'dsh-music-settings-title' }, t('effectsOptions')),
              h('div', { className: 'dsh-music-settings-sub' }, t('effectsHint'))
            ),
            h(
              'div',
              { className: 'dsh-music-settings-row is-column' },
              h(
                'div',
                { className: 'dsh-music-settings-row-head' },
                h(
                  'div',
                  { className: 'dsh-music-settings-copy' },
                  h(
                    'div',
                    { className: 'dsh-music-settings-label' },
                    t('particleCount'),
                    h(
                      'span',
                      { className: 'dsh-music-settings-warning' },
                      t('particleCountWarning')
                    )
                  ),
                  h(
                    'div',
                    { className: 'dsh-music-settings-note' },
                    String(settings.particleCount)
                  )
                ),
                h(SettingReset, {
                  t,
                  disabled: isDefault('particleCount'),
                  onClick: () => resetSetting('particleCount')
                })
              ),
              h('input', {
                type: 'range',
                min: 0,
                max: 200,
                step: 1,
                value: settings.particleCount,
                'aria-label': t('particleCount'),
                onChange: (event) =>
                  onChange({ particleCount: Number(event.target.value) })
              }),
              h(
                'div',
                { className: 'dsh-music-settings-scale' },
                h('span', null, '0'),
                h('span', null, '200')
              ),
              h('div', { className: 'dsh-music-settings-note' }, t('particleCountHint'))
            ),
            h(
              'div',
              { className: 'dsh-music-settings-effect-group' },
              h(
                'div',
                { className: 'dsh-music-settings-effect-title' },
                t('recordParticles')
              ),
              h(
                'div',
                { className: 'dsh-music-settings-row is-column' },
                h(
                  'div',
                  { className: 'dsh-music-settings-row-head' },
                  h(
                    'div',
                    { className: 'dsh-music-settings-copy' },
                    h(
                      'div',
                      { className: 'dsh-music-settings-label' },
                      t('recordParticleSize')
                    ),
                    h(
                      'div',
                      { className: 'dsh-music-settings-note' },
                      settings.recordParticleSize + '%'
                    )
                  ),
                  h(SettingReset, {
                    t,
                    disabled: isDefault('recordParticleSize'),
                    onClick: () => resetSetting('recordParticleSize')
                  })
                ),
                h('input', {
                  type: 'range',
                  min: 0,
                  max: 200,
                  step: 1,
                  value: settings.recordParticleSize,
                  'aria-label': t('recordParticleSize'),
                  onChange: (event) =>
                    onChange({ recordParticleSize: Number(event.target.value) })
                }),
                h(
                  'div',
                  { className: 'dsh-music-settings-scale' },
                  h('span', null, '0'),
                  h('span', null, '200')
                ),
                h('div', { className: 'dsh-music-settings-note' }, t('effectSizeHint'))
              ),
              h(
                'div',
                { className: 'dsh-music-settings-row is-column' },
                h(
                  'div',
                  { className: 'dsh-music-settings-row-head' },
                  h(
                    'div',
                    { className: 'dsh-music-settings-copy' },
                    h(
                      'div',
                      { className: 'dsh-music-settings-label' },
                      t('recordParticleColor')
                    ),
                    h(
                      'div',
                      { className: 'dsh-music-settings-note' },
                      settings.recordParticleColor
                        ? settings.recordParticleColor.toUpperCase()
                        : t('followCover')
                    )
                  )
                ),
                h(
                  'div',
                  { className: 'dsh-music-color-row' },
                  h('input', {
                    type: 'color',
                    value: settings.recordParticleColor || '#ffffff',
                    'aria-label': t('recordParticleColor'),
                    onChange: (event) =>
                      onChange({ recordParticleColor: event.target.value })
                  }),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'dsh-music-text-reset',
                      disabled: !settings.recordParticleColor,
                      onClick: () => onChange({ recordParticleColor: '' })
                    },
                    t('followCover')
                  )
                ),
                h('div', { className: 'dsh-music-settings-note' }, t('effectColorHint'))
              )
            ),
            h(
              'div',
              { className: 'dsh-music-settings-effect-group' },
              h(
                'div',
                { className: 'dsh-music-settings-effect-title' },
                t('barParticles')
              ),
              h(
                'div',
                { className: 'dsh-music-settings-row is-column' },
                h(
                  'div',
                  { className: 'dsh-music-settings-row-head' },
                  h(
                    'div',
                    { className: 'dsh-music-settings-copy' },
                    h(
                      'div',
                      { className: 'dsh-music-settings-label' },
                      t('barParticleSize')
                    ),
                    h(
                      'div',
                      { className: 'dsh-music-settings-note' },
                      settings.barParticleSize + '%'
                    )
                  ),
                  h(SettingReset, {
                    t,
                    disabled: isDefault('barParticleSize'),
                    onClick: () => resetSetting('barParticleSize')
                  })
                ),
                h('input', {
                  type: 'range',
                  min: 0,
                  max: 200,
                  step: 1,
                  value: settings.barParticleSize,
                  'aria-label': t('barParticleSize'),
                  onChange: (event) =>
                    onChange({ barParticleSize: Number(event.target.value) })
                }),
                h(
                  'div',
                  { className: 'dsh-music-settings-scale' },
                  h('span', null, '0'),
                  h('span', null, '200')
                ),
                h('div', { className: 'dsh-music-settings-note' }, t('effectSizeHint'))
              ),
              h(
                'div',
                { className: 'dsh-music-settings-row is-column' },
                h(
                  'div',
                  { className: 'dsh-music-settings-row-head' },
                  h(
                    'div',
                    { className: 'dsh-music-settings-copy' },
                    h(
                      'div',
                      { className: 'dsh-music-settings-label' },
                      t('barParticleColor')
                    ),
                    h(
                      'div',
                      { className: 'dsh-music-settings-note' },
                      settings.barParticleColor
                        ? settings.barParticleColor.toUpperCase()
                        : t('followBarColor')
                    )
                  )
                ),
                h(
                  'div',
                  { className: 'dsh-music-color-row' },
                  h('input', {
                    type: 'color',
                    value: settings.barParticleColor || settings.barColor,
                    'aria-label': t('barParticleColor'),
                    onChange: (event) =>
                      onChange({ barParticleColor: event.target.value })
                  }),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'dsh-music-text-reset',
                      disabled: !settings.barParticleColor,
                      onClick: () => onChange({ barParticleColor: '' })
                    },
                    t('followBarColor')
                  )
                ),
                h('div', { className: 'dsh-music-settings-note' }, t('effectColorHint'))
              )
            ),
            h(
              'div',
              { className: 'dsh-music-settings-effect-group' },
              h(
                'div',
                { className: 'dsh-music-settings-effect-title' },
                t('barGlow')
              ),
              h(
                'div',
                { className: 'dsh-music-settings-row is-column' },
                h(
                  'div',
                  { className: 'dsh-music-settings-row-head' },
                  h(
                    'div',
                    { className: 'dsh-music-settings-copy' },
                    h(
                      'div',
                      { className: 'dsh-music-settings-label' },
                      t('barGlowSize')
                    ),
                    h(
                      'div',
                      { className: 'dsh-music-settings-note' },
                      settings.barGlowSize + '%'
                    )
                  ),
                  h(SettingReset, {
                    t,
                    disabled: isDefault('barGlowSize'),
                    onClick: () => resetSetting('barGlowSize')
                  })
                ),
                h('input', {
                  type: 'range',
                  min: 0,
                  max: 200,
                  step: 1,
                  value: settings.barGlowSize,
                  'aria-label': t('barGlowSize'),
                  onChange: (event) =>
                    onChange({ barGlowSize: Number(event.target.value) })
                }),
                h(
                  'div',
                  { className: 'dsh-music-settings-scale' },
                  h('span', null, '0'),
                  h('span', null, '200')
                ),
                h('div', { className: 'dsh-music-settings-note' }, t('effectSizeHint'))
              ),
              h(
                'div',
                { className: 'dsh-music-settings-row is-column' },
                h(
                  'div',
                  { className: 'dsh-music-settings-row-head' },
                  h(
                    'div',
                    { className: 'dsh-music-settings-copy' },
                    h(
                      'div',
                      { className: 'dsh-music-settings-label' },
                      t('barGlowColor')
                    ),
                    h(
                      'div',
                      { className: 'dsh-music-settings-note' },
                      settings.barGlowColor
                        ? settings.barGlowColor.toUpperCase()
                        : t('followBarColor')
                    )
                  )
                ),
                h(
                  'div',
                  { className: 'dsh-music-color-row' },
                  h('input', {
                    type: 'color',
                    value: settings.barGlowColor || settings.barColor,
                    'aria-label': t('barGlowColor'),
                    onChange: (event) =>
                      onChange({ barGlowColor: event.target.value })
                  }),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'dsh-music-text-reset',
                      disabled: !settings.barGlowColor,
                      onClick: () => onChange({ barGlowColor: '' })
                    },
                    t('followBarColor')
                  )
                ),
                h('div', { className: 'dsh-music-settings-note' }, t('effectColorHint'))
              )
            )
          ),
          h('div', { className: 'dsh-music-settings-foot' }, t('autoSaved'))
        )
      );
    }

    function MusicSettingsPortal(props) {
      const snapshot = useSettingsStore(props.store);
      useEffect(() => {
        if (!snapshot.open) return undefined;
        const onKeyDown = (event) => {
          if (event.key === 'Escape') props.store.close();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
      }, [snapshot.open, props.store]);

      return h(
        React.Fragment,
        null,
        h('style', { key: 'dsh-music-styles' }, CSS),
        snapshot.open
          ? h(SettingsOverlay, {
              settings: snapshot.settings,
              onChange: props.store.update,
              onReset: props.store.reset,
              onClose: props.store.close,
              t: props.t
            })
          : null
      );
    }

    function MusicPanel(props) {
      const player = props.player;
      const t = props.t;
      useLocaleTick(props.locale);
      const state = usePlayerSelector(player, selectPanelState, shallowEqual);
      const [query, setQuery] = useState('');
      const [dragging, setDragging] = useState(false);
      const settingsSnapshot = useSettingsStore(props.settingsStore);
      const settings = settingsSnapshot.settings;
      const rawCardOpacity = Number(settings.cardOpacity);
      const cardOpacityCss = String(
        (Number.isFinite(rawCardOpacity)
          ? Math.max(0, Math.min(100, rawCardOpacity))
          : DEFAULT_SETTINGS.cardOpacity) / 100
      );
      const rawTextColor = String(settings.playerTextColor || '');
      const playerTextColor = /^#[0-9a-f]{6}$/i.test(rawTextColor) ? rawTextColor : '';
      const rawVinylColor = String(settings.vinylColor || '');
      const vinylColor = /^#[0-9a-f]{6}$/i.test(rawVinylColor)
        ? rawVinylColor
        : DEFAULT_SETTINGS.vinylColor;
      const rootStyle = {
        '--dsh-music-card-opacity': cardOpacityCss,
        '--dsh-music-vinyl-color': vinylColor
      };
      if (playerTextColor) rootStyle['--dsh-music-text-color'] = playerTextColor;
      const fileInput = useRef(null);
      const artRef = useRef(null);

      useEffect(() => {
        const onKeyDown = (event) => {
          if (event.defaultPrevented || event.isComposing || event.repeat) return;
          if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
          const target = event.target;
          if (
            target &&
            typeof target.closest === 'function' &&
            target.closest('input, textarea, select, [contenteditable="true"]')
          ) {
            return;
          }
          const snapshot = props.settingsStore.getSnapshot();
          if (snapshot.open) return;
          const shortcuts =
            (snapshot.settings && snapshot.settings.shortcuts) ||
            DEFAULT_SETTINGS.shortcuts;
          const code = event.code;
          if (!code) return;

          if (code === shortcuts.playPause) {
            if (
              shortcuts.playPause === 'Space' &&
              target &&
              typeof target.closest === 'function' &&
              target.closest('button, a, [role="button"], [role="slider"]')
            ) {
              return;
            }
            event.preventDefault();
            player.toggle();
            return;
          }
          if (code === shortcuts.previous) {
            event.preventDefault();
            player.previous();
            return;
          }
          if (code === shortcuts.next) {
            event.preventDefault();
            player.next(false);
          }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
      }, [player, props.settingsStore]);

      const current = state.tracks.find((track) => track.id === state.currentId) || null;
      const totalDuration = state.tracks.reduce((sum, track) => {
        return sum + (Number(track.duration) > 0 ? Number(track.duration) : 0);
      }, 0);

      const rows = useMemo(() => {
        const needle = query.trim().toLowerCase();
        const result = [];
        for (let index = 0; index < state.tracks.length; index += 1) {
          const track = state.tracks[index];
          if (needle && track.name.toLowerCase().indexOf(needle) < 0) continue;
          result.push({ track, index });
        }
        return result;
      }, [state.tracks, query]);

      const openPicker = useCallback(() => {
        if (fileInput.current) fileInput.current.click();
      }, []);

      const onFiles = useCallback(
        (files) => {
          if (files && files.length) player.importFiles(files);
        },
        [player]
      );

      const onPlay = useCallback(
        (id) => {
          player.playTrack(id);
        },
        [player]
      );

      const onRemove = useCallback(
        (id) => {
          player.remove(id);
        },
        [player]
      );

      const onFileInput = useCallback(
        (event) => {
          const files = event.target.files;
          if (files && files.length) onFiles(files);
          event.target.value = '';
        },
        [onFiles]
      );

      const onDrop = useCallback(
        (event) => {
          event.preventDefault();
          setDragging(false);
          if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length) {
            onFiles(event.dataTransfer.files);
          }
        },
        [onFiles]
      );

      const onDragOver = useCallback((event) => {
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
        setDragging(true);
      }, []);

      const onDragLeave = useCallback((event) => {
        if (event.currentTarget.contains(event.relatedTarget)) return;
        setDragging(false);
      }, []);

      const countLabel = state.tracks.length + ' ' + t('tracksUnit');
      const subtitle =
        state.tracks.length > 0
          ? countLabel + ' · ' + (totalDuration > 0 ? formatDuration(totalDuration) : t('unknownDuration'))
          : t('subtitle');

      return h(
        'div',
        {
          className: 'dsh-music-shell',
          onDragOver: onDragOver,
          onDragLeave: onDragLeave,
          onDrop: onDrop
        },
        h(
          'div',
          {
            id: 'dsh-music-root',
            className:
              'dsh-music-root' +
              (settings.spectrumEnabled ? '' : ' is-spectrum-off') +
              (playerTextColor ? ' is-custom-text' : ''),
            style: rootStyle
          },
          h('input', {
            ref: fileInput,
            type: 'file',
            accept: 'audio/*,.mp3,.m4a,.aac,.wav,.flac,.ogg,.oga,.opus,.weba,.webm',
            multiple: true,
            style: { display: 'none' },
            onChange: onFileInput
          }),
          settings.spectrumEnabled
            ? h(Spectrum, {
                player,
                artRef,
                maxBarHeight: settings.maxBarHeight,
                barSpeed: settings.barSpeed,
                barOpacity: settings.barOpacity,
                barColor: settings.barColor,
                barParticleSize: settings.barParticleSize,
                barParticleColor: settings.barParticleColor,
                barGlowSize: settings.barGlowSize,
                barGlowColor: settings.barGlowColor,
                particleCount: settings.particleCount,
                playing: state.playing && !!current,
                trackId: current ? current.id : '',
                variant: 'player-backdrop'
              })
            : null,
          h(
            'header',
            { className: 'dsh-music-header' },
            h(
              'div',
              { className: 'dsh-music-heading' },
              h('div', { className: 'dsh-music-eyebrow' }, t('eyebrow')),
              h('h1', { className: 'dsh-music-title' }, t('title')),
              h('div', { className: 'dsh-music-subtitle' }, subtitle)
            ),
            h(
              'div',
              { className: 'dsh-music-header-actions' },
              h(
                'button',
                {
                  type: 'button',
                  className: 'dsh-music-btn is-primary',
                  onClick: openPicker,
                  disabled: state.importing
                },
                h(IconUpload, { size: 16 }),
                h('span', null, state.importing ? t('importing') : t('import'))
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'dsh-music-settings-btn',
                  title: t('settings'),
                  'aria-label': t('settings'),
                  onClick: () => props.settingsStore.open()
                },
                h(IconGear, { size: 17 })
              )
            )
          ),
          state.storage === 'unavailable'
            ? h(
                'div',
                { className: 'dsh-music-banner is-warning', role: 'status' },
                h('span', null, t('storageWarning'))
              )
            : null,
          state.error
            ? h(
                'div',
                { className: 'dsh-music-banner is-error', role: 'alert' },
                h('span', null, t('error.' + state.error)),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-music-banner-close',
                    title: t('dismiss'),
                    'aria-label': t('dismiss'),
                    onClick: () => player.clearError()
                  },
                  h(IconClose, { size: 14 })
                )
              )
            : null,
          h(
            'div',
            { className: 'dsh-music-content' },
            h(
              'section',
              { className: 'dsh-music-card dsh-music-playlist' },
              h(
                'div',
                { className: 'dsh-music-playlist-head' },
                h(
                  'div',
                  { className: 'dsh-music-section-title' },
                  h('span', null, t('playlist')),
                  h('span', { className: 'dsh-music-count' }, countLabel)
                ),
                state.tracks.length > 3
                  ? h(
                      'label',
                      { className: 'dsh-music-search' },
                      h(IconSearch, { size: 15 }),
                      h('input', {
                        type: 'text',
                        value: query,
                        placeholder: t('searchPlaceholder'),
                        'aria-label': t('searchPlaceholder'),
                        onChange: (event) => setQuery(event.target.value)
                      })
                    )
                  : null
              ),
              !state.ready
                ? h(
                    'div',
                    { className: 'dsh-music-empty' },
                    h('div', { className: 'dsh-music-spinner' }),
                    h('div', { className: 'dsh-music-empty-body' }, t('loading'))
                  )
                : state.tracks.length === 0
                  ? h(
                      'div',
                      { className: 'dsh-music-empty' },
                      h('div', { className: 'dsh-music-empty-icon' }, h(IconMusic, { size: 34 })),
                      h('div', { className: 'dsh-music-empty-title' }, t('emptyTitle')),
                      h('div', { className: 'dsh-music-empty-body' }, t('emptyBody')),
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'dsh-music-btn is-primary',
                          onClick: openPicker,
                          disabled: state.importing
                        },
                        h(IconUpload, { size: 16 }),
                        h('span', null, state.importing ? t('importing') : t('emptyAction'))
                      ),
                      h('div', { className: 'dsh-music-drop-hint' }, t('dragHint'))
                    )
                  : rows.length === 0
                    ? h(
                        'div',
                        { className: 'dsh-music-empty' },
                        h('div', { className: 'dsh-music-empty-body' }, t('searchNoResults'))
                      )
                    : h(
                        'div',
                        { className: 'dsh-music-list', role: 'list' },
                        rows.map((row) =>
                          h(MemoTrackRow, {
                            key: row.track.id,
                            track: row.track,
                            index: row.index,
                            active: row.track.id === state.currentId,
                            playing: state.playing,
                            unknownDuration: t('unknownDuration'),
                            removeLabel: t('remove'),
                            onPlay,
                            onRemove
                          })
                        )
                      )
            ),
            h(
              'section',
              { className: 'dsh-music-card dsh-music-now-card' },
              h(NowPlaying, {
                player,
                t,
                current,
                artRef,
                labelImage: settings.labelImage || '',
                recordParticleSize: settings.recordParticleSize,
                recordParticleColor: settings.recordParticleColor || '',
                particleCount: settings.particleCount,
                shortcuts: settings.shortcuts || DEFAULT_SETTINGS.shortcuts
              })
            )
          )
        ),
        dragging
          ? h(
              'div',
              { className: 'dsh-music-drop' },
              h('div', { className: 'dsh-music-drop-icon' }, h(IconUpload, { size: 34 })),
              h('div', { className: 'dsh-music-drop-title' }, t('dropTitle')),
              h('div', { className: 'dsh-music-drop-body' }, t('dropBody'))
            )
          : null
      );
    }

    function SidebarIcon(props) {
      const playing = usePlayerSelector(props.player, selectPlaying);
      const size = props.size || 18;
      return h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: size,
          height: size,
          'aria-hidden': true,
          focusable: false,
          style: {
            display: 'block',
            color: props.active ? 'var(--dsw-alias-brand-primary)' : 'currentColor'
          }
        },
        h('path', {
          d: 'M9.5 18V6.3l8.5-1.9v11',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.8,
          strokeLinecap: 'round',
          strokeLinejoin: 'round'
        }),
        h('ellipse', { cx: 7, cy: 18, rx: 2.8, ry: 2.4, fill: 'currentColor' }),
        h('ellipse', { cx: 15.5, cy: 15.4, rx: 2.8, ry: 2.4, fill: 'currentColor' }),
        playing
          ? h('circle', {
              cx: 20,
              cy: 4,
              r: 2.6,
              fill: 'var(--dsw-alias-state-success-primary)',
              stroke: 'var(--dsw-alias-sidebar-fill, transparent)',
              strokeWidth: 1
            })
          : null
      );
    }

    const CSS = `
.dsh-music-shell {
  position: relative;
  height: 100%;
  min-height: 0;
  overflow: visible;
  container-type: inline-size;
  container-name: dsh-music;
}
.dsh-music-root {
  box-sizing: border-box;
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 24px 28px;
  overflow: hidden;
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary);
  font-family: inherit;
}
.dsh-music-header {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  flex: none;
}
.dsh-music-heading {
  min-width: 0;
}
.dsh-music-eyebrow {
  margin-bottom: 5px;
  color: var(--dsw-alias-brand-primary);
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.12em;
}
.dsh-music-title {
  margin: 0;
  font-size: 26px;
  font-weight: 650;
  line-height: 1.15;
  letter-spacing: -0.02em;
}
.dsh-music-subtitle {
  margin-top: 5px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12.5px;
  line-height: 1.4;
}
.dsh-music-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
}
.dsh-music-settings-btn {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex: none;
  padding: 0;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 9px;
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  cursor: pointer;
}
.dsh-music-settings-btn:hover {
  background: var(--dsw-alias-bg-layer-2);
}
.dsh-music-btn {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 34px;
  padding: 7px 13px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 9px;
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}
.dsh-music-btn:not(.is-primary):hover:not(:disabled) {
  background: var(--dsw-alias-bg-layer-2);
}
.dsh-music-btn.is-primary {
  border-color: #1d4ed8;
  background: #2563eb;
  color: #ffffff;
}
.dsh-music-btn.is-primary:hover:not(:disabled) {
  border-color: #1d4ed8;
  background: #1d4ed8;
  filter: none;
}
.dsh-music-btn:disabled {
  cursor: default;
  opacity: 0.55;
}
.dsh-music-banner {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex: none;
  margin-top: 12px;
  padding: 8px 11px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 9px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
  line-height: 1.45;
}
.dsh-music-banner.is-error {
  border-color: var(--dsw-alias-state-error-primary);
  color: var(--dsw-alias-state-error-primary);
}
.dsh-music-banner.is-warning {
  border-color: var(--dsw-alias-state-warn-primary);
  color: var(--dsw-alias-label-primary);
}
.dsh-music-banner-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
.dsh-music-banner-close:hover {
  background: var(--dsw-alias-bg-layer-1);
}
.dsh-music-content {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  grid-template-rows: minmax(0, 1fr);
  gap: 18px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding-top: 18px;
}
.dsh-music-card {
  position: relative;
  isolation: isolate;
  min-height: 0;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 14px;
  background: transparent;
}
.dsh-music-card::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  background: var(--dsw-alias-bg-layer-1);
  opacity: var(--dsh-music-card-opacity, 0.64);
  -webkit-backdrop-filter: blur(18px) saturate(1.1);
  backdrop-filter: blur(18px) saturate(1.1);
  pointer-events: none;
}
.dsh-music-playlist {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.dsh-music-playlist-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex: none;
  padding: 11px 14px;
  border-bottom: 1px solid var(--dsw-alias-border-l1);
}
.dsh-music-section-title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 12.5px;
  font-weight: 650;
}
.dsh-music-count {
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  font-weight: 500;
}
.dsh-music-search {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 180px;
  padding: 5px 9px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 8px;
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-tertiary);
}
.dsh-music-search:focus-within {
  border-color: var(--dsw-alias-brand-primary);
}
.dsh-music-search input {
  width: 100%;
  min-width: 0;
  padding: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 12px;
}
.dsh-music-search input::placeholder {
  color: var(--dsw-alias-label-tertiary);
}
.dsh-music-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-height: 0;
  padding: 7px;
  overflow-y: auto;
}
.dsh-music-row {
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) 30px;
  align-items: center;
  gap: 9px;
  padding: 8px 9px;
  border: 1px solid transparent;
  border-radius: 9px;
  cursor: pointer;
  outline: none;
}
.dsh-music-row:hover {
  background: var(--dsw-alias-bg-layer-2);
}
.dsh-music-row:focus-visible {
  border-color: var(--dsw-alias-brand-primary);
}
.dsh-music-row.is-active {
  background: var(--dsw-alias-bg-layer-2);
  border-color: var(--dsw-alias-border-l2);
  box-shadow: inset 2px 0 0 var(--dsw-alias-brand-primary);
}
.dsh-music-row-index {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 7px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}
.dsh-music-row.is-active .dsh-music-row-index {
  color: var(--dsw-alias-brand-primary);
}
.dsh-music-row-main {
  min-width: 0;
}
.dsh-music-row-title {
  overflow: hidden;
  color: var(--dsw-alias-label-primary);
  font-size: 12.5px;
  font-weight: 550;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dsh-music-row.is-active .dsh-music-row-title {
  color: var(--dsw-alias-brand-primary);
}
.dsh-music-row-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 2px;
  overflow: hidden;
  color: var(--dsw-alias-label-tertiary);
  font-size: 10.5px;
  line-height: 1.3;
  white-space: nowrap;
}
.dsh-music-row-meta span {
  overflow: hidden;
  text-overflow: ellipsis;
}
.dsh-music-dot {
  flex: none;
  opacity: 0.65;
}
.dsh-music-row-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  cursor: pointer;
  opacity: 0;
}
.dsh-music-row:hover .dsh-music-row-remove,
.dsh-music-row:focus-within .dsh-music-row-remove,
.dsh-music-row.is-active .dsh-music-row-remove {
  opacity: 1;
}
.dsh-music-row-remove:hover {
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-state-error-primary);
}
.dsh-music-eq {
  display: inline-flex;
  align-items: flex-end;
  gap: 2px;
  width: 14px;
  height: 14px;
}
.dsh-music-eq i {
  display: block;
  width: 3px;
  height: 100%;
  border-radius: 1px;
  background: var(--dsw-alias-brand-primary);
  transform-origin: bottom;
  animation: dsh-music-bar 0.9s ease-in-out infinite;
}
.dsh-music-eq i:nth-child(2) {
  animation-delay: 0.18s;
}
.dsh-music-eq i:nth-child(3) {
  animation-delay: 0.34s;
}
.dsh-music-empty {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 9px;
  min-height: 0;
  padding: 34px 24px;
  text-align: center;
}
.dsh-music-empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  margin-bottom: 2px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 16px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-brand-primary);
}
.dsh-music-empty-title {
  font-size: 15px;
  font-weight: 650;
}
.dsh-music-empty-body {
  max-width: 360px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  line-height: 1.55;
}
.dsh-music-empty .dsh-music-btn {
  margin-top: 4px;
}
.dsh-music-drop-hint {
  margin-top: 2px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 10.5px;
}
.dsh-music-spinner {
  width: 22px;
  height: 22px;
  margin-bottom: 4px;
  border: 2px solid var(--dsw-alias-border-l2);
  border-top-color: var(--dsw-alias-brand-primary);
  border-radius: 50%;
  animation: dsh-music-spin 0.8s linear infinite;
}
.dsh-music-now-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}
.dsh-music-now-card::before {
  display: none !important;
}
.dsh-music-now-card .dsh-music-now {
  flex: 1;
  min-height: 0;
}
.dsh-music-now {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
  padding: 20px 14px 14px;
  overflow-y: auto;
  isolation: isolate;
}
.dsh-music-particle-canvas {
  position: absolute;
  inset: 0;
  z-index: 0;
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.dsh-music-now > .dsh-music-art,
.dsh-music-now-copy,
.dsh-music-progress,
.dsh-music-controls {
  position: relative;
  z-index: 1;
}
.dsh-music-art {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 260px;
  margin: 0 auto;
  aspect-ratio: 1 / 1;
  flex: none;
  overflow: visible;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: #f8fafc;
  box-shadow: none;
  transform: scale(var(--dsh-music-art-scale, 1));
  transform-origin: center center;
  will-change: transform;
}
.dsh-music-art.is-empty {
  color: var(--dsw-alias-label-tertiary);
}
.dsh-music-vinyl-plate {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}
.dsh-music-vinyl-plate::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 112%;
  aspect-ratio: 1 / 1;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 50%;
  background: var(--dsw-alias-bg-layer-1);
  box-shadow:
    0 18px 36px rgba(0, 0, 0, 0.35),
    inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  opacity: var(--dsh-music-card-opacity, 0.64);
  -webkit-backdrop-filter: blur(18px) saturate(1.1);
  backdrop-filter: blur(18px) saturate(1.1);
  clip-path: circle(50% at 50% 50%);
  transform: translate(-50%, -50%);
}
.dsh-music-vinyl {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 88%;
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 50%;
  box-shadow:
    0 14px 28px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.28),
    0 0 0 7px rgba(255, 255, 255, 0.035);
  transform: translate(-50%, -50%);
  z-index: 2;
}
.dsh-music-vinyl-disc {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  clip-path: circle(50% at 50% 50%);
  background:
    radial-gradient(
      circle at 50% 50%,
      transparent 0 16%,
      rgba(255, 255, 255, 0.06) 16.2% 16.6%,
      transparent 17%
    ),
    repeating-radial-gradient(
      circle at 50% 50%,
      rgba(255, 255, 255, 0.055) 0 1px,
      rgba(0, 0, 0, 0.5) 1px 2.5px,
      transparent 2.5px 4.5px
    ),
    radial-gradient(
      circle at 32% 26%,
      color-mix(in srgb, var(--dsh-music-vinyl-color, #0a0b10) 52%, #ffffff) 0%,
      var(--dsh-music-vinyl-color, #0a0b10) 38%,
      color-mix(in srgb, var(--dsh-music-vinyl-color, #0a0b10) 55%, #000000) 72%
    );
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.09);
  transform-origin: 50% 50%;
  will-change: transform;
}
.dsh-music-vinyl-grooves {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: repeating-radial-gradient(
    circle at 50% 50%,
    transparent 0 3px,
    rgba(255, 255, 255, 0.025) 3px 4px
  );
  pointer-events: none;
}
.dsh-music-vinyl-label {
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34%;
  height: 34%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.68);
  border-radius: 50%;
  background: #ffffff;
  color: #ffffff;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.12em;
  line-height: 1;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
  clip-path: circle(50% at 50% 50%);
  transform: translate(-50%, -50%);
}
.dsh-music-vinyl-label-image {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  pointer-events: none;
  user-select: none;
}
.dsh-music-vinyl-spindle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 7px;
  height: 7px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  background: #05070a;
  transform: translate(-50%, -50%);
  z-index: 2;
}
.dsh-music-vinyl-shine {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  z-index: 3;
  background: conic-gradient(
    from 210deg at 50% 50%,
    transparent 0 18%,
    rgba(255, 255, 255, 0.13) 24%,
    transparent 31%,
    transparent 70%,
    rgba(255, 255, 255, 0.07) 78%,
    transparent 86%
  );
  mix-blend-mode: screen;
  pointer-events: none;
}
.dsh-music-tonearm {
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
}
.dsh-music-tonearm-svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}
.dsh-music-tonearm-arm {
  transform-box: view-box;
  transform-origin: 190px 30px;
  transform: rotate(38deg);
  transition: transform 1.7s cubic-bezier(0.22, 0.75, 0.25, 1);
  will-change: transform;
}
.dsh-music-art.is-playing .dsh-music-tonearm-arm {
  transform: rotate(-2deg) translateY(2px);
}
.dsh-music-art.is-empty .dsh-music-vinyl-disc {
  filter: grayscale(1);
  opacity: 0.65;
}
.dsh-music-art.is-empty .dsh-music-vinyl-label {
  background: #4a5260;
}.dsh-music-art.is-empty .dsh-music-tonearm {
  opacity: 0.6;
}
.dsh-music-now-copy {
  min-width: 0;
}
.dsh-music-now-label {
  margin-bottom: 3px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.dsh-music-now-title {
  overflow: hidden;
  font-size: 16px;
  font-weight: 650;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dsh-music-now-sub {
  overflow: hidden;
  margin-top: 3px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 11px;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dsh-music-progress {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.dsh-music-visualizer {
  box-sizing: border-box;
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  width: auto;
  height: 320px;
  max-height: 330px;
  z-index: 999;
  display: block;
  overflow: hidden;
  pointer-events: none;
  border-top: 1px solid var(--dsw-alias-border-l1);
  background: linear-gradient(180deg, transparent 0%, rgba(37, 99, 235, 0.06) 100%);
}
.dsh-music-visualizer.is-player-backdrop {
  position: absolute;
  inset: 0;
  width: auto;
  height: 100%;
  max-height: none;
  z-index: -1;
  border: 0;
  background: transparent;
}
.dsh-music-visualizer.is-workspace {
  position: relative;
  left: auto;
  right: auto;
  bottom: auto;
  width: 100%;
  height: 200px;
  max-height: 200px;
  margin: 8px 0 0;
  z-index: 0;
  flex: none;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 12px;
  background: linear-gradient(180deg, transparent 0%, rgba(37, 99, 235, 0.07) 100%);
}
.dsh-music-visualizer.is-workspace .dsh-music-bars {
  padding: 0 3%;
}
[data-conversation-content] {
  isolation: isolate;
}
.dsh-music-workspace-layer {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  overflow: hidden;
}
.dsh-music-visualizer.is-workspace-backdrop {
  position: absolute;
  left: 0;
  right: 0;
  bottom: var(--dsh-music-workspace-bottom, 0px);
  width: auto;
  height: 200px;
  max-height: 200px;
  z-index: 0;
  border: 0;
  border-radius: 0;
  margin: 0;
  background: transparent;
}
.dsh-music-visualizer.is-workspace-backdrop .dsh-music-bars {
  padding: 0 3%;
}
.dsh-music-bars {
  position: absolute;
  inset: 0;
  box-sizing: border-box;
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  gap: clamp(2px, 0.5vw, 6px);
  padding: 0 2.5%;
  transform: translateY(0);
  z-index: 0;
  filter:
    drop-shadow(0 0 var(--dsh-music-bar-glow-small, 5px) color-mix(in srgb, var(--dsh-music-bar-glow-color, #4f8cff) 68%, transparent))
    drop-shadow(0 0 var(--dsh-music-bar-glow-large, 16px) color-mix(in srgb, var(--dsh-music-bar-glow-color, #4f8cff) 38%, transparent));
  will-change: transform;
}
.dsh-music-bar-particles {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.dsh-music-bar {
  display: block;
  align-self: flex-end;
  flex: 1 1 0;
  height: 200px;
  max-height: 100%;
  min-width: 3px;
  max-width: 40px;
  border-radius: 999px 999px 0 0;
  background: var(--dsh-music-bar-color, #4f8cff);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--dsh-music-bar-color, #4f8cff) 62%, #ffffff) 0%,
    var(--dsh-music-bar-color, #4f8cff) 52%,
    color-mix(in srgb, var(--dsh-music-bar-color, #4f8cff) 78%, #0b1220) 100%
  );
  opacity: var(--dsh-music-bar-opacity, 0.64);
  transform: scaleY(0.05);
  transform-origin: 50% 100%;
  will-change: transform;
}
.dsh-music-root input[type='range'] {
  width: 100%;
  margin: 0;
  accent-color: var(--dsw-alias-brand-primary);
  cursor: pointer;
}
.dsh-music-root input[type='range']:disabled {
  cursor: default;
  opacity: 0.45;
}
.dsh-music-times {
  display: flex;
  justify-content: space-between;
  color: var(--dsw-alias-label-tertiary);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}
#dsh-music-root.is-custom-text {
  --dsh-music-text-primary: var(--dsh-music-text-color);
  --dsh-music-text-tertiary: color-mix(
    in srgb,
    var(--dsh-music-text-color) 70%,
    transparent
  );
}
#dsh-music-root.is-custom-text :is(
    .dsh-music-eyebrow,
    .dsh-music-title,
    .dsh-music-section-title,
    .dsh-music-row-title,
    .dsh-music-empty-title,
    .dsh-music-now-title,
    .dsh-music-drop-title,
    .dsh-music-search input
  ) {
  color: var(--dsh-music-text-primary);
}
#dsh-music-root.is-custom-text :is(
    .dsh-music-subtitle,
    .dsh-music-count,
    .dsh-music-row-index,
    .dsh-music-row-meta,
    .dsh-music-empty-body,
    .dsh-music-drop-hint,
    .dsh-music-now-label,
    .dsh-music-now-sub,
    .dsh-music-times,
    .dsh-music-drop-body
  ) {
  color: var(--dsh-music-text-tertiary);
}
#dsh-music-root.is-custom-text .dsh-music-search input::placeholder {
  color: var(--dsh-music-text-tertiary);
}
#dsh-music-root.is-custom-text
  .dsh-music-banner:not(.is-error):not(.is-warning) {
  color: var(--dsh-music-text-tertiary);
}
.dsh-music-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.dsh-music-iconbtn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
}
.dsh-music-iconbtn:hover:not(:disabled) {
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-primary);
}
.dsh-music-iconbtn:disabled {
  cursor: default;
  opacity: 0.4;
}
.dsh-music-iconbtn.is-on {
  color: var(--dsw-alias-brand-primary);
}
.dsh-music-repeat-badge {
  position: absolute;
  top: 0;
  right: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #2563eb;
  color: #ffffff;
  font-size: 8px;
  font-weight: 700;
  line-height: 1;
}
.dsh-music-playbtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  margin: 0 3px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: #2563eb;
  color: #ffffff;
  cursor: pointer;
}
.dsh-music-playbtn:hover:not(:disabled) {
  background: #1d4ed8;
  filter: none;
}
.dsh-music-playbtn:disabled {
  cursor: default;
  opacity: 0.45;
}
.dsh-music-volume {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: 2px;
}
.dsh-music-volume input[type='range'] {
  flex: 1;
}
.dsh-music-mute {
  width: 28px;
  height: 28px;
  flex: none;
}
.dsh-music-drop {
  position: absolute;
  inset: 10px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 2px dashed var(--dsw-alias-brand-primary);
  border-radius: 16px;
  background: var(--dsw-alias-bg-overlay);
  color: var(--dsw-alias-label-primary);
  pointer-events: none;
}
.dsh-music-drop-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 16px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-brand-primary);
}
.dsh-music-drop-title {
  font-size: 17px;
  font-weight: 650;
}
.dsh-music-drop-body {
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
}
.dsh-music-list::-webkit-scrollbar,
.dsh-music-now::-webkit-scrollbar {
  width: 8px;
}
.dsh-music-list::-webkit-scrollbar-thumb,
.dsh-music-now::-webkit-scrollbar-thumb {
  border: 2px solid transparent;
  border-radius: 8px;
  background: var(--dsw-alias-border-l2);
  background-clip: padding-box;
}
@keyframes dsh-music-bar {
  0%, 100% { transform: scaleY(0.35); }
  50% { transform: scaleY(1); }
}
@keyframes dsh-music-spin {
  to { transform: rotate(360deg); }
}
@container dsh-music (max-width: 860px) {
  .dsh-music-content {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr);
  }
  .dsh-music-now {
    order: -1;
    display: grid;
    grid-template-columns: 170px minmax(0, 1fr);
    grid-template-rows: auto auto auto auto;
    column-gap: 14px;
    align-items: center;
  }
  .dsh-music-art {
    grid-row: 1 / span 4;
    max-width: none;
  }
  .dsh-music-progress,
  .dsh-music-controls,
  .dsh-music-volume {
    grid-column: 2;
  }
  .dsh-music-volume {
    padding-top: 0;
  }
}
@container dsh-music (max-width: 620px) {
  .dsh-music-root {
    padding: 16px 14px;
  }
  .dsh-music-visualizer {
    height: 320px;
  }
  .dsh-music-title {
    font-size: 22px;
  }
  .dsh-music-header {
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 12px;
  }
  .dsh-music-playlist-head {
    flex-wrap: wrap;
  }
  .dsh-music-search {
    width: 100%;
  }
  .dsh-music-now {
    grid-template-columns: 116px minmax(0, 1fr);
  }
}
@media (prefers-reduced-motion: reduce) {
  .dsh-music-eq i,
  .dsh-music-spinner {
    animation: none;
  }
  .dsh-music-tonearm-arm {
    transition-duration: 0.01s;
  }
}

.dsh-music-settings-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: stretch;
  justify-content: center;
  padding: 0;
  background: rgba(0, 0, 0, 0.35);
  pointer-events: auto;
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}
.dsh-music-settings-panel {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  max-height: none;
  overflow-y: auto;
  padding: 32px max(24px, calc((100vw - 820px) / 2));
  border: 0;
  border-radius: 0;
  background: var(--dsw-alias-bg-overlay);
  background: color-mix(in srgb, var(--dsw-alias-bg-overlay) 88%, transparent);
  -webkit-backdrop-filter: blur(24px) saturate(1.3);
  backdrop-filter: blur(24px) saturate(1.3);
  color: var(--dsw-alias-label-primary);
  box-shadow: none;
}
.dsh-music-settings-panel:focus {
  outline: none;
}
.dsh-music-settings-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.dsh-music-settings-heading {
  min-width: 0;
}
.dsh-music-settings-title {
  font-size: 20px;
  font-weight: 650;
  line-height: 1.3;
}
.dsh-music-settings-sub {
  margin-top: 5px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  line-height: 1.45;
}
.dsh-music-settings-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex: none;
  padding: 0;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 8px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
}
.dsh-music-settings-close:hover {
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-primary);
}
.dsh-music-settings-tabs {
  display: flex;
  gap: 4px;
  margin-top: 18px;
  padding: 4px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 10px;
  background: var(--dsw-alias-bg-layer-1);
}
.dsh-music-settings-tab {
  flex: 1;
  min-width: 0;
  padding: 9px 12px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font: inherit;
  font-size: 12.5px;
  font-weight: 600;
  line-height: 1.3;
  cursor: pointer;
}
.dsh-music-settings-tab:hover {
  color: var(--dsw-alias-label-primary);
}
.dsh-music-settings-tab.is-active {
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-primary);
  box-shadow: inset 0 0 0 1px var(--dsw-alias-border-l1);
}
.dsh-music-settings-page {
  margin-top: 14px;
}
.dsh-music-settings-page.is-hidden {
  display: none;
}
.dsh-music-settings-page-head {
  padding: 4px 0 14px;
}
.dsh-music-settings-page-head .dsh-music-settings-title {
  font-size: 18px;
}
.dsh-music-settings-page-head .dsh-music-settings-sub {
  margin-top: 4px;
}
.dsh-music-settings-effect-group {
  margin-top: 6px;
}
.dsh-music-settings-effect-title {
  padding: 14px 0 0;
  color: var(--dsw-alias-label-secondary);
  font-size: 12.5px;
  font-weight: 650;
  line-height: 1.35;
}
.dsh-music-settings-warning {
  margin-left: 6px;
  color: var(--dsw-alias-label-error, #e5484d);
  font-size: 11.5px;
  font-weight: 500;
  line-height: 1.35;
}
.dsh-music-label-editor {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.dsh-music-label-preview {
  width: 64px;
  height: 64px;
  flex: none;
  border: 2px solid var(--dsw-alias-border-l2);
  border-radius: 50%;
  background: #ffffff;
  object-fit: cover;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.25);
}
.dsh-music-label-select {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 9px 14px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
}
.dsh-music-label-select:hover:not(:disabled) {
  background: var(--dsw-alias-bg-layer-2);
}
.dsh-music-label-select:disabled {
  cursor: default;
  opacity: 0.55;
}
.dsh-music-label-error {
  color: var(--dsw-alias-label-error, #e5484d);
  font-size: 12px;
  line-height: 1.4;
}
.dsh-music-settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 18px 0;
  border-top: 1px solid var(--dsw-alias-border-l1);
}
.dsh-music-settings-head + .dsh-music-settings-row {
  margin-top: 14px;
}
.dsh-music-settings-row.is-column {
  flex-direction: column;
  align-items: stretch;
  gap: 9px;
}
.dsh-music-settings-copy {
  min-width: 0;
}
.dsh-music-settings-row.is-column .dsh-music-settings-copy {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
.dsh-music-settings-label {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.35;
}
.dsh-music-settings-note {
  margin-top: 4px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  line-height: 1.4;
}
.dsh-music-settings-row.is-column .dsh-music-settings-note {
  margin-top: 0;
  flex: none;
  font-variant-numeric: tabular-nums;
}
.dsh-music-settings-panel input[type='range'] {
  width: 100%;
  margin: 0;
  accent-color: var(--dsw-alias-brand-primary);
  cursor: pointer;
}
.dsh-music-settings-scale {
  display: flex;
  justify-content: space-between;
  color: var(--dsw-alias-label-tertiary);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}
.dsh-music-settings-row.is-select {
  flex-wrap: wrap;
}
.dsh-music-settings-row.is-select .dsh-music-settings-copy {
  flex: 1 1 260px;
}
.dsh-music-settings-select {
  flex: none;
  min-width: 170px;
  max-width: 100%;
  margin-left: auto;
  padding: 8px 12px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 12.5px;
  cursor: pointer;
}
.dsh-music-settings-select:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 2px;
}
.dsh-music-settings-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
}
.dsh-music-settings-row-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.dsh-music-settings-row-head .dsh-music-settings-copy {
  flex: 1;
}
.dsh-music-setting-reset {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex: none;
  padding: 0;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 7px;
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  cursor: pointer;
}
.dsh-music-setting-reset:hover:not(:disabled) {
  border-color: var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-primary);
}
.dsh-music-setting-reset:disabled {
  cursor: default;
  opacity: 0.4;
}
.dsh-music-switch {
  position: relative;
  display: inline-flex;
  width: 44px;
  height: 24px;
  flex: none;
}
.dsh-music-switch input {
  position: absolute;
  inset: 0;
  z-index: 2;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}
.dsh-music-switch-track {
  position: relative;
  display: block;
  width: 44px;
  height: 24px;
  border-radius: 999px;
  background: var(--dsw-alias-border-l2);
  transition: background 0.16s ease;
}
.dsh-music-switch-track::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
  transition: transform 0.16s ease;
}
.dsh-music-switch input:checked + .dsh-music-switch-track {
  background: #2563eb;
}
.dsh-music-switch input:checked + .dsh-music-switch-track::after {
  transform: translateX(20px);
}
.dsh-music-switch input:focus-visible + .dsh-music-switch-track {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 2px;
}
.dsh-music-color-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.dsh-music-color-row input[type='color'] {
  width: 46px;
  height: 34px;
  flex: none;
  padding: 2px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-2);
  cursor: pointer;
}
.dsh-music-text-reset {
  min-height: 34px;
  padding: 0 13px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-secondary);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.dsh-music-text-reset:hover:not(:disabled) {
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-primary);
}
.dsh-music-text-reset:disabled {
  cursor: default;
  opacity: 0.45;
}
.dsh-music-presets {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.dsh-music-swatch {
  width: 22px;
  height: 22px;
  flex: none;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.18);
  cursor: pointer;
}
.dsh-music-swatch.is-active {
  border-color: var(--dsw-alias-label-primary);
}
.dsh-music-shortcut-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.dsh-music-shortcut-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.dsh-music-shortcut-name {
  color: var(--dsw-alias-label-secondary);
  font-size: 12.5px;
  line-height: 1.4;
}
.dsh-music-shortcut-key {
  min-width: 96px;
  padding: 7px 12px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
}
.dsh-music-shortcut-key:hover {
  background: var(--dsw-alias-bg-layer-2);
}
.dsh-music-shortcut-key.is-capturing {
  border-color: var(--dsw-alias-brand-primary);
  color: var(--dsw-alias-brand-primary);
}
.dsh-music-shortcut-error {
  margin-top: 8px;
  color: var(--dsw-alias-state-error-primary);
  font-size: 11px;
  line-height: 1.4;
}
.dsh-music-settings-reset {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 18px;
  padding: 14px 16px;
  border: 1px solid var(--dsw-alias-state-error-primary);
  border-radius: 12px;
  background: color-mix(
    in srgb,
    var(--dsw-alias-state-error-primary) 8%,
    transparent
  );
}
.dsh-music-settings-reset-copy {
  min-width: 0;
  flex: 1 1 260px;
}
.dsh-music-settings-reset-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.dsh-music-reset-btn,
.dsh-music-reset-confirm,
.dsh-music-reset-cancel {
  min-height: 34px;
  padding: 0 13px;
  border-radius: 8px;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.dsh-music-reset-btn {
  border: 1px solid var(--dsw-alias-state-error-primary);
  background: transparent;
  color: var(--dsw-alias-state-error-primary);
}
.dsh-music-reset-btn:hover {
  background: color-mix(
    in srgb,
    var(--dsw-alias-state-error-primary) 12%,
    transparent
  );
}
.dsh-music-reset-confirm {
  border: 1px solid #b91c1c;
  background: #dc2626;
  color: #ffffff;
}
.dsh-music-reset-confirm:hover {
  border-color: #991b1b;
  background: #b91c1c;
}
.dsh-music-reset-cancel {
  border: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
}
.dsh-music-reset-cancel:hover {
  background: var(--dsw-alias-bg-layer-2);
}
.dsh-music-settings-foot {
  margin-top: 4px;
  padding-top: 12px;
  border-top: 1px solid var(--dsw-alias-border-l1);
  color: var(--dsw-alias-label-tertiary);
  font-size: 10.5px;
}
@media (max-width: 620px) {
  .dsh-music-settings-panel {
    padding: 20px 16px;
  }
}

/*
 * Wallpaper-safe controls.
 *
 * The wallpaper plugin remaps --dsw-alias-bg-base to transparent and can
 * restyle/overlay global buttons. Never use a background token as the
 * foreground of a filled button: it becomes transparent and the label and
 * icon disappear. These rules pin both the fill and the ink, and lift the
 * icon/text above any wallpaper or glass pseudo-element.
 */
#dsh-music-root .dsh-music-btn.is-primary {
  background: #2563eb !important;
  background-color: #2563eb !important;
  background-image: none !important;
  background-blend-mode: normal !important;
  background-clip: border-box !important;
  -webkit-background-clip: border-box !important;
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  border: 1px solid #1d4ed8 !important;
  border-color: #1d4ed8 !important;
  opacity: 1 !important;
  filter: none !important;
  mix-blend-mode: normal !important;
  -webkit-backdrop-filter: none !important;
  backdrop-filter: none !important;
  clip-path: none !important;
  text-shadow: none !important;
  position: relative !important;
  z-index: 6 !important;
  isolation: isolate;
  pointer-events: auto !important;
}
#dsh-music-root .dsh-music-btn.is-primary:hover:not(:disabled) {
  background: #1d4ed8 !important;
  background-color: #1d4ed8 !important;
  background-image: none !important;
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  filter: none !important;
}
#dsh-music-root .dsh-music-btn.is-primary:disabled {
  background: #2563eb !important;
  background-color: #2563eb !important;
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  opacity: 0.55 !important;
}
#dsh-music-root .dsh-music-btn.is-primary > svg {
  display: inline-block !important;
  flex: none !important;
  width: 16px !important;
  height: 16px !important;
  color: #ffffff !important;
  fill: none !important;
  stroke: currentColor !important;
  opacity: 1 !important;
  visibility: visible !important;
  position: relative !important;
  z-index: 7 !important;
  filter: none !important;
  mix-blend-mode: normal !important;
  pointer-events: none !important;
}
#dsh-music-root .dsh-music-btn.is-primary > svg * {
  color: #ffffff !important;
  fill: none !important;
  stroke: currentColor !important;
  opacity: 1 !important;
  visibility: visible !important;
}
#dsh-music-root .dsh-music-btn.is-primary > span {
  display: inline-block !important;
  position: relative !important;
  z-index: 7 !important;
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  font-size: 12.5px !important;
  line-height: 1.2 !important;
  letter-spacing: normal !important;
  text-indent: 0 !important;
  text-align: center !important;
  text-transform: none !important;
  white-space: nowrap !important;
  opacity: 1 !important;
  visibility: visible !important;
  filter: none !important;
  mix-blend-mode: normal !important;
  text-shadow: none !important;
}
#dsh-music-root .dsh-music-playbtn {
  background: #2563eb !important;
  background-color: #2563eb !important;
  background-image: none !important;
  background-clip: border-box !important;
  -webkit-background-clip: border-box !important;
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  border: 0 !important;
  opacity: 1 !important;
  filter: none !important;
  mix-blend-mode: normal !important;
  -webkit-backdrop-filter: none !important;
  backdrop-filter: none !important;
  position: relative !important;
  z-index: 6 !important;
  isolation: isolate;
  pointer-events: auto !important;
}
#dsh-music-root .dsh-music-playbtn:hover:not(:disabled) {
  background: #1d4ed8 !important;
  background-color: #1d4ed8 !important;
  background-image: none !important;
  filter: none !important;
}
#dsh-music-root .dsh-music-playbtn:disabled {
  background: #2563eb !important;
  background-color: #2563eb !important;
  opacity: 0.45 !important;
}
#dsh-music-root .dsh-music-playbtn > svg {
  display: inline-block !important;
  color: #ffffff !important;
  fill: currentColor !important;
  stroke: none !important;
  opacity: 1 !important;
  visibility: visible !important;
  position: relative !important;
  z-index: 7 !important;
  filter: none !important;
  mix-blend-mode: normal !important;
  pointer-events: none !important;
}
#dsh-music-root .dsh-music-playbtn > svg * {
  color: #ffffff !important;
  fill: currentColor !important;
  stroke: none !important;
  opacity: 1 !important;
  visibility: visible !important;
}
#dsh-music-root .dsh-music-repeat-badge {
  background: #2563eb !important;
  background-color: #2563eb !important;
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  opacity: 1 !important;
  position: absolute !important;
  z-index: 8 !important;
  pointer-events: none !important;
}
`;

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        try {
          const player = new Player();
          const settingsStore = createSettingsStore();
          let locale = null;
          let t = (key) => (Object.prototype.hasOwnProperty.call(EN, key) ? EN[key] : key);

          try {
            locale = ctx.locale;
            if (locale && typeof locale.bind === 'function') {
              t = locale.bind(NS);
            }
            if (
              locale &&
              typeof locale.register === 'function' &&
              typeof ctx.effect === 'function'
            ) {
              ctx.effect(() => {
                const disposers = [];
                const locales = ['en', 'en-US', 'zh', 'zh-CN', 'zh-Hans'];
                for (let index = 0; index < locales.length; index += 1) {
                  const id = locales[index];
                  try {
                    disposers.push(locale.register(NS, id, MESSAGES[id]));
                  } catch (error) {
                    console.error('cannot register music-player locale', id, error);
                  }
                }
                return () => {
                  disposers.forEach((dispose) => dispose());
                };
              }, 'music-player locales');
            }
          } catch (error) {
            console.error('music-player locale setup failed:', error && error.stack ? error.stack : error);
          }

          if (typeof ctx.effect === 'function') {
            ctx.effect(() => {
              return () => player.dispose();
            }, 'music-player audio');
            ctx.effect(() => {
              return () => settingsStore.dispose();
            }, 'music-player settings');
          }

          ctx.slots.inject('shell.overlay', () => {
            return ctx.slots.register(
              {
                name: 'shell.overlay',
                id: 'music-settings',
                order: 1100,
                label: () => t('settings')
              },
              () => h(MusicSettingsPortal, { store: settingsStore, t })
            );
          });

          ctx.slots.inject('sidebar.panellist', () => {
            return ctx.slots.register(
              {
                name: 'sidebar.panellist',
                id: 'music',
                order: 20,
                label: () => t('sidebar.label')
              },
              (slotProps) => h(SidebarIcon, Object.assign({}, slotProps, { player }))
            );
          });

          ctx.slots.inject('main', () => {
            return ctx.slots.register(
              { name: 'main', key: 'music' },
              (slotProps) =>
                h(
                  MusicPanel,
                  Object.assign({}, slotProps, { player, t, locale, settingsStore })
                )
            );
          });

          ctx.slots.inject('conversation.input.dock', () => {
            return ctx.slots.register(
              {
                name: 'conversation.input.dock',
                id: 'music-workspace-bars',
                order: 100,
                label: () => t('workspaceSpectrumEnabled')
              },
              () => h(WorkspaceBackdrop, { player, settingsStore })
            );
          });
        } catch (error) {
          console.error(
            'dsh-music-player activation failed:',
            error && error.stack ? error.stack : error
          );
          // A UI plugin must never abort the Harness web boot. The failure is
          // logged above; the rest of the application keeps working.
        }
      }
    };
  }
});

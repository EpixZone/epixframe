export default [
  {
    input: 'src/epixframe.js',
    output: {
      file: 'dist/epixframe.js',
      format: 'umd',
      name: 'EpixFrameModule',
      exports: 'named',
      footer: `
if (typeof window !== 'undefined') {
  window.EpixFrame = EpixFrameModule.EpixFrame;
  var _epixFrameSingleton = null;
  Object.defineProperty(window, 'epixFrame', {
    get: function() {
      if (!_epixFrameSingleton) _epixFrameSingleton = new EpixFrameModule.EpixFrame();
      return _epixFrameSingleton;
    },
    configurable: true
  });
}`
    }
  },
  {
    input: 'src/epixframe.js',
    output: {
      file: 'dist/epixframe.esm.js',
      format: 'es'
    }
  }
];

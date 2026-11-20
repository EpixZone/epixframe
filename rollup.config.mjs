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
  // The module's lazy shared instance (the one the ESM export proxies), so
  // window.epixFrame and EpixFrameModule.epixFrame are the same frame.
  Object.defineProperty(window, 'epixFrame', {
    get: function() {
      return EpixFrameModule.epixFrame();
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

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
  if (!window.epixFrame) window.epixFrame = new EpixFrameModule.EpixFrame();
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

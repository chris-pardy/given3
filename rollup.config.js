import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import dts from 'rollup-plugin-dts';
import pkg from './package.json';

export default [
  {
    input: 'src/index.ts',
    plugins: [
      resolve({ extensions: ['.ts'] }),
      babel({ extensions: ['.ts'], babelHelpers: 'bundled' })
    ],
    output: [
      {
        file: pkg.main,
        format: 'cjs',
        sourcemap: true
      },
      {
        file: pkg.module,
        format: 'es',
        sourcemap: true
      }
    ]
  },
  {
    input: './build/index.d.ts',
    plugins: [dts()],
    output: [
      {
        file: pkg.typings,
        format: 'es'
      }
    ]
  }
];

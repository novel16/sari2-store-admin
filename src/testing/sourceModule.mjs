import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

// Exercise the actual TypeScript sources with Node's test runner, without a second bundler.
export function createSourceModule(baseUrl) {
  return async function sourceModule(path, imports = {}, substitutions = {}) {
    let source = await readFile(new URL(path, baseUrl), 'utf8')
    for (const [from, to] of Object.entries(substitutions)) source = source.replaceAll(from, to)
    let output = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2023 },
    }).outputText
    for (const [from, to] of Object.entries(imports))
      output = output.replaceAll(`'${from}'`, `'${to}'`)
    return `data:text/javascript;base64,${Buffer.from(output).toString('base64')}`
  }
}

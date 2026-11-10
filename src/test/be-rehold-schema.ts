import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import ts from 'typescript'

// Execute the actual strict BE schema without importing Express, config or the database.
const be = resolve(process.cwd(), '../BE')
const requireBE = createRequire(resolve(be, 'package.json'))
const { z } = requireBE('zod')
const source = (path: string) => ts.createSourceFile(path, readFileSync(resolve(be, path), 'utf8'), ts.ScriptTarget.Latest, true)
const checkout = source('src/v2/http/pt-checkout.ts')
const validation = source('src/shared/validation.ts')
const scheduling = source('src/v2/domain/scheduling.ts')
function declaration(file: ts.SourceFile, name: string) {
  let expression: string | undefined
  function walk(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(file) === name) expression = node.initializer?.getText(file)
    ts.forEachChild(node, walk)
  }
  walk(file)
  if (!expression) throw new Error(`Missing BE validator: ${name}`)
  return expression
}
const bindings: Record<string, unknown> = { z }
const evaluate = (expression: string) => new Function(...Object.keys(bindings), `return (${expression})`)(...Object.values(bindings))
for (const [file, name] of [[scheduling, 'hhmm'], [scheduling, 'weeklyPattern'], [validation, 'text'], [checkout, 'key'], [checkout, 'date']] as const) bindings[name] = evaluate(declaration(file, name))
let expression: string | undefined
function findRoute(node: ts.Node) {
  if (ts.isCallExpression(node) && node.expression.getText(checkout) === 'route' && node.arguments[2]?.getText(checkout) === "'/pt-purchases/:id/rehold'") expression = node.arguments[4]?.getText(checkout)
  ts.forEachChild(node, findRoute)
}
findRoute(checkout)
if (!expression) throw new Error('Missing BE rehold schema')
export const beReholdSchema = evaluate(expression) as { parse: (value: unknown) => unknown; safeParse: (value: unknown) => { success: boolean } }

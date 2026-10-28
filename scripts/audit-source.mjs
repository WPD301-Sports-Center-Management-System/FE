import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const files=fs.readdirSync('src',{recursive:true}).filter(f=>/\.(tsx?|css)$/.test(f)).map(f=>path.resolve('src',f))
const code=new Map(files.map(f=>[f,fs.readFileSync(f,'utf8')]))
const imports=new Map(), packages=new Set(), calls=[]
const back=JSON.parse(fs.readFileSync('../BE/src/contract/endpoints.json','utf8'))
const resolve=(source,name)=>{
  const base=name.startsWith('@/')?path.resolve('src',name.slice(2)):path.resolve(path.dirname(source),name)
  return [base,...['.ts','.tsx','.css','/index.ts','/index.tsx'].map(ext=>base+ext)].find(f=>code.has(f))
}
for(const [file,source] of code){
 const deps=[]
 const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true)
 const visit=n=>{
  if(ts.isImportDeclaration(n)&&ts.isStringLiteral(n.moduleSpecifier)){
   const spec=n.moduleSpecifier.text
   if(spec.startsWith('.')||spec.startsWith('@/')){const target=resolve(file,spec);if(target)deps.push(target)}
   else packages.add(spec.startsWith('@')?spec.split('/').slice(0,2).join('/'):spec.split('/')[0])
  }
  if(ts.isCallExpression(n)&&n.expression.kind===ts.SyntaxKind.ImportKeyword&&n.arguments[0]&&ts.isStringLiteral(n.arguments[0])){
   const target=resolve(file,n.arguments[0].text);if(target)deps.push(target)
  }
  const methodName=ts.isCallExpression(n)?(ts.isPropertyAccessExpression(n.expression)?n.expression.name.text:ts.isIdentifier(n.expression)?n.expression.text:''):''
  if(ts.isCallExpression(n)&&['get','post','patch','put','delete','raw','all','page','total'].includes(methodName)){
   const arg=n.arguments[0]
   if(arg&&(ts.isStringLiteral(arg)||ts.isNoSubstitutionTemplateLiteral(arg)||ts.isTemplateExpression(arg))){
    const url=ts.isTemplateExpression(arg)?arg.head.text+arg.templateSpans.map(s=>':value'+s.literal.text).join(''):arg.text
    if(url.startsWith('/')){
     const method=['raw','all','page','total'].includes(methodName)?'GET':methodName.toUpperCase()
     const rx=new RegExp('^'+url.split('/').map(s=>s.includes(':value')?'[^/]+':s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('/')+'$')
     const found=back.some(e=>e.method===method&&rx.test(e.path))
     calls.push({file:path.relative('.',file),line:ast.getLineAndCharacterOfPosition(n.getStart()).line+1,method,url,found})
    }
   }
  }
  ts.forEachChild(n,visit)
 };visit(ast);imports.set(file,deps)
}
const reachable=new Set()
const walk=file=>{if(!file||reachable.has(file))return;reachable.add(file);for(const d of imports.get(file)??[])walk(d)}
walk(path.resolve('src/main.tsx'));walk(path.resolve('src/entry-prerender.tsx'))
const manifest=JSON.parse(fs.readFileSync('package.json','utf8'))
const report={unusedDependencyCandidates:Object.keys(manifest.dependencies).filter(p=>!packages.has(p)&&p!=='react-dom'),unreachableSourceCandidates:files.filter(f=>!reachable.has(f)&&!/(\.test\.|\/test\/|\\test\\|\.d\.ts$)/.test(f)).map(f=>path.relative('.',f)),unmatchedDirectCalls:calls.filter(c=>!c.found&&!c.file.includes('.test.')),checkedDirectCalls:calls.length}
fs.mkdirSync('../Docs/evidence/fe-audit-2026-10-28',{recursive:true})
fs.writeFileSync('../Docs/evidence/fe-audit-2026-10-28/source-audit.json',JSON.stringify(report,null,2))
console.log(JSON.stringify(report,null,2))

// Restricted arithmetic parser. Never execute entered text as JavaScript.
export function calculateExpression(input) {
  const source=String(input).replaceAll(',','.').replaceAll('×','*').replaceAll('÷','/').replaceAll('−','-');
  if(source.length>120||!/^[\d.\s+*/()\-]+$/.test(source))throw new RangeError('Utilisez des nombres et + − × ÷ ( ).');
  const tokens=source.match(/\d+(?:\.\d*)?|\.\d+|[+*/()\-]/g)||[];
  let position=0,depth=0;
  function atom() {
    if(++depth>32)throw new RangeError('Expression trop complexe.');
    const token=tokens[position++];let value;
    if(token==='+'||token==='-')value=(token==='-'?-1:1)*atom();
    else if(token==='('){value=sum();if(tokens[position++]!==')')throw new RangeError('Fermez les parenthèses.');}
    else if(token!==undefined&&/^(?:\d|\.)/.test(token))value=Number(token);
    else throw new RangeError('Expression incomplète.');
    depth--;return value;
  }
  function product(){let value=atom();while(['*','/'].includes(tokens[position])){const operator=tokens[position++],right=atom();if(operator==='/'&&right===0)throw new RangeError('Division par zéro impossible.');value=operator==='*'?value*right:value/right;}return value;}
  function sum(){let value=product();while(['+','-'].includes(tokens[position])){const operator=tokens[position++],right=product();value=operator==='+'?value+right:value-right;}return value;}
  const result=sum();
  if(position!==tokens.length||!Number.isFinite(result))throw new RangeError('Expression invalide.');
  return Math.round(result*1000000)/1000000;
}

import assert from 'node:assert/strict';

// Simulador puro sin red, sin base de datos y sin clientes reales.
function aplazar(origen, saldos, motivo) {
  if (motivo.trim().length < 5) throw Error('Motivo obligatorio');
  if (origen.estado !== 'confirmada' || origen.pago !== 'recibido') throw Error('No pagada');
  if (!(origen.importe > 0)) throw Error('Saldo no válido');
  if (saldos.has(origen.id)) throw Error('Aplazamiento duplicado');
  const next = structuredClone(origen);
  next.estado = 'aplazada';
  const ledger = new Map(saldos);
  ledger.set(origen.id, origen.importe);
  return {reserva:next, ledger};
}
const demo={id:'reserva-demo',estado:'confirmada',pago:'recibido',importe:34,plazas:2};
const input=new Map();
const result=aplazar(demo,input,'No puede asistir');
assert.equal(result.reserva.estado,'aplazada');
assert.equal(result.ledger.get(demo.id),34);
assert.equal(demo.estado,'confirmada','No mutar datos de entrada');
assert.equal(input.size,0,'No mutar movimientos de entrada');
assert.throws(()=>aplazar(result.reserva,result.ledger,'Segundo intento'));
assert.throws(()=>aplazar({...demo,pago:'pendiente'},input,'No puede asistir'));
assert.throws(()=>aplazar({...demo,importe:0},input,'No puede asistir'));
assert.throws(()=>aplazar(demo,input,''));
const occupied=(list)=>list.filter(r=>!['cancelada','aplazada'].includes(r.estado)).reduce((sum,r)=>sum+r.plazas,0);
assert.equal(occupied([demo]),2);
assert.equal(occupied([result.reserva]),0);

// Prueba de capacidad y conservación de saldo con otra experiencia ficticia.
function asignarCredito(ledger,reservaId,experiencia,plazas,importeNecesario) {
 if(!ledger.has(reservaId)) throw Error('No existe crédito');
 if(!Number.isInteger(plazas)||plazas<1)throw Error('Número de plazas no válido');
 if(experiencia.ocupadas+plazas>experiencia.aforo)throw Error('Aforo completo');
 const credito=ledger.get(reservaId);
 if(credito<importeNecesario)throw Error('Falta completar la aportación');
 const updated={...experiencia,ocupadas:experiencia.ocupadas+plazas};
 const next=new Map(ledger);next.delete(reservaId);
 return {experiencia:updated,ledger:next,saldoRestante:credito-importeNecesario};
}
const destino={id:22,aforo:10,ocupadas:8};
const transferida=asignarCredito(result.ledger,demo.id,destino,2,30);
assert.equal(transferida.experiencia.ocupadas,10);
assert.equal(transferida.saldoRestante,4);
assert.equal(transferida.ledger.size,0);
assert.equal(result.ledger.get(demo.id),34,'El crédito origen sigue intacto');
assert.equal(destino.ocupadas,8,'El aforo origen sigue intacto');
assert.throws(()=>asignarCredito(result.ledger,demo.id,destino,3,30),/Aforo completo/);
assert.throws(()=>asignarCredito(result.ledger,demo.id,destino,2,35),/aportación/);
assert.throws(()=>asignarCredito(transferida.ledger,demo.id,destino,1,10),/No existe crédito/);

// Caso de aportación superior: el remanente no puede desaparecer.
// Se modela un libro auxiliar de créditos para impedir pérdidas contables.
function transferenciaConRemanente(credito,precio) {
 if (!Number.isFinite(credito)||!Number.isFinite(precio)||credito<0||precio<0)throw Error('Importes inválidos');
 if (precio>credito) return {aplicado:credito,pendiente:precio-credito,remanente:0,confirmable:false};
 return {aplicado:precio,pendiente:0,remanente:credito-precio,confirmable:true};
}
const diferenciaFavor=transferenciaConRemanente(34,30);
assert.deepEqual(diferenciaFavor,{aplicado:30,pendiente:0,remanente:4,confirmable:true});
assert.equal(diferenciaFavor.aplicado+diferenciaFavor.remanente,34);
const diferenciaPendiente=transferenciaConRemanente(34,40);
assert.deepEqual(diferenciaPendiente,{aplicado:34,pendiente:6,remanente:0,confirmable:false});
assert.equal(diferenciaPendiente.aplicado+diferenciaPendiente.pendiente,40);
assert.throws(()=>transferenciaConRemanente(-1,20));
assert.throws(()=>transferenciaConRemanente(20,NaN));
console.log('Simulación gratuita: saldo, duplicados, pago, rollback lógico y liberación de plazas OK.');

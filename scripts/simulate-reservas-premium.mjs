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
console.log('Simulación gratuita: saldo, duplicados, pago, rollback lógico y liberación de plazas OK.');

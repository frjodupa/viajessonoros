/** Vista de reservas administrativas. Datos de prueba o previamente autorizados. */
const STATUS=Object.freeze({pending:'Pendiente',confirmed:'Confirmada',waitlist:'Lista de espera',cancelled:'Cancelada'});
export function buildAttendeeRows(reservations){
 if(!Array.isArray(reservations))throw Error('Listado inválido');
 return reservations.map(item=>{
   if(!item||typeof item!=='object'||!Object.hasOwn(STATUS,item.status))throw Error('Estado inválido');
   const id=String(item.id||'');
   const seats=Number(item.seats);
   if(!id||!Number.isSafeInteger(seats)||seats<1)throw Error('Reserva inválida');
   return {id,seats,status:item.status,label:STATUS[item.status],
     canConfirm:item.status==='pending'||item.status==='waitlist',
     canCancel:item.status!=='cancelled'};
 });
}
export function renderAttendeeRows(container,rows,{onConfirm,onCancel}={}){
 if(!container?.ownerDocument||typeof container.replaceChildren!=='function')throw Error('Contenedor requerido');
 const doc=container.ownerDocument,table=doc.createElement('table');
 const caption=doc.createElement('caption');caption.textContent='Reservas de la experiencia';table.append(caption);
 const head=doc.createElement('thead'),tr=doc.createElement('tr');
 for(const label of ['Reserva','Plazas','Estado','Acciones']){
  const th=doc.createElement('th');th.scope='col';th.textContent=label;tr.append(th);
 }
 head.append(tr);table.append(head);
 const body=doc.createElement('tbody');
 for(const row of rows){
  const line=doc.createElement('tr');
  for(const value of [row.id,row.seats,row.label]){
   const td=doc.createElement('td');td.textContent=String(value);line.append(td);
  }
  const actions=doc.createElement('td');
  for(const [label,allowed,callback] of [['Confirmar',row.canConfirm,onConfirm],['Cancelar',row.canCancel,onCancel]]){
   if(!allowed)continue;
   const button=doc.createElement('button');button.type='button';button.textContent=label;
   button.disabled=typeof callback!=='function';
   if(!button.disabled)button.addEventListener('click',()=>callback(row.id));
   actions.append(button);
  }
  line.append(actions);body.append(line);
 }
 table.append(body);container.replaceChildren(table);
}

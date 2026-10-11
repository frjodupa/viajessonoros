/** Modelo de presentación para futuro panel móvil de reservas.
 * Datos agregados exclusivamente; nunca recibe contactos de asistentes.
 */
const STATES=['pending','confirmed','waitlist','cancelled'];
export function buildBookingDashboard({capacity,minimum,counts}){
 if(!Number.isSafeInteger(capacity)||capacity<1||!Number.isSafeInteger(minimum)||minimum<1||minimum>capacity)
   throw Error('Aforo o mínimo inválido');
 if(!counts||typeof counts!=='object')throw Error('Conteos inválidos');
 const values={};
 for(const key of STATES){
  const v=counts[key]??0;
  if(!Number.isSafeInteger(v)||v<0)throw Error('Conteo inválido: '+key);
  values[key]=v;
 }
 if(values.confirmed>capacity)throw Error('Ocupación superior al aforo');
 return Object.freeze({
  capacity,minimum,confirmed:values.confirmed,pending:values.pending,
  waitlist:values.waitlist,cancelled:values.cancelled,
  available:capacity-values.confirmed,
  minimumReached:values.confirmed>=minimum,
  missingMinimum:Math.max(0,minimum-values.confirmed),
  occupancyPercent:Math.round(100*values.confirmed/capacity)
 });
}
export function renderBookingDashboard(container,model){
 if(!container||typeof container.replaceChildren!=='function'||!container.ownerDocument)
  throw Error('Contenedor DOM requerido');
 const doc=container.ownerDocument;
 const section=doc.createElement('section');
 section.className='vs-booking-dashboard';
 section.setAttribute('aria-label','Resumen de reservas');
 const heading=doc.createElement('h2');heading.textContent='Asistentes y reservas';
 section.append(heading);
 const summary=doc.createElement('p');
 summary.textContent=model.confirmed+' de '+model.capacity+' plazas confirmadas';
 section.append(summary);
 const progress=doc.createElement('progress');
 progress.max=model.capacity;progress.value=model.confirmed;
 progress.setAttribute('aria-label','Plazas confirmadas');
 section.append(progress);
 const cards=doc.createElement('dl');
 for(const [name,value] of [
  ['Disponibles',model.available],['Pendientes',model.pending],
  ['Lista de espera',model.waitlist],['Canceladas',model.cancelled],
  ['Asistentes restantes para mínimo',model.missingMinimum]
 ]){
  const dt=doc.createElement('dt');dt.textContent=name;
  const dd=doc.createElement('dd');dd.textContent=String(value);
  cards.append(dt,dd);
 }
 section.append(cards);
 const status=doc.createElement('p');
 status.setAttribute('role','status');
 status.textContent=model.minimumReached?'Aforo mínimo alcanzado':'Aforo mínimo pendiente';
 section.append(status);
 container.replaceChildren(section);
}

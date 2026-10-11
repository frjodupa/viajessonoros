/** Recorrido compartido cliente → panel administrativo, solo en memoria y datos ficticios. */
export function createBookingDemoJourney({capacity=12,initialConfirmed=2}={}){
 if(!Number.isSafeInteger(capacity)||capacity<1||!Number.isSafeInteger(initialConfirmed)||initialConfirmed<0||initialConfirmed>capacity)throw Error('INVALID_CAPACITY');
 let request=null;
 return Object.freeze({
  submit({seats}){
   if(request)throw Error('REQUEST_ALREADY_EXISTS');
   if(!Number.isSafeInteger(Number(seats))||Number(seats)<1||Number(seats)>10)throw Error('INVALID_SEATS');
   request={id:'DEMO-REQUEST',seats:Number(seats),status:'pending'};
   return {...request};
  },
  overview(){
   return {capacity,confirmed:initialConfirmed+(request?.status==='confirmed'?request.seats:0),
    pending:request?.status==='pending'?request.seats:0,
    available:capacity-initialConfirmed-(request?.status==='confirmed'?request.seats:0),
    request:request?{...request}:null};
  },
  decide(action){
   if(!request||request.status!=='pending')return {changed:false,reason:'INVALID_TRANSITION'};
   if(action==='confirm'){
    if(initialConfirmed+request.seats>capacity)return {changed:false,reason:'CAPACITY_EXCEEDED'};
    request.status='confirmed';
   }else if(action==='cancel')request.status='cancelled';
   else return {changed:false,reason:'INVALID_ACTION'};
   return {changed:true,status:request.status};
  },
  reset(){request=null}
 });
}

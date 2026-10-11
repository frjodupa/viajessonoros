/** Pure client-side convenience check; real capacity remains server-authoritative. */
export function isBookingEventUpcoming(event, now=new Date()){
 if(!event||event.publicado!==true)return false;
 const date=String(event.fecha||'');
 const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
 if(!match)return false;
 const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]);
 const time=/^(\d{1,2}):(\d{2})/.exec(String(event.hora||''));
 const hours=time?Number(time[1]):23,minutes=time?Number(time[2]):59;
 if(hours>23||minutes>59)return false;
 const end=new Date(year,month-1,day,hours,minutes,time?0:59,time?0:999);
 if(end.getFullYear()!==year||end.getMonth()!==month-1||end.getDate()!==day)return false;
 return end>=now;
}

function getNumeroSemana(fecha){
    const primerDiaAnio=new Date(fecha.getFullYear(),0,1),
        diasTranscurridos=(fecha-primerDiaAnio)/86400000;

    return Math.ceil((diasTranscurridos-primerDiaAnio.getDay()+1)/7);
};

function anioBisiesto(fecha){
    console.log(fecha)
    return fecha % 100===0 ? fecha % 400 === 0: fecha % 4===0
}

class Dia{
    constructor(fecha=null, lang='default'){
        fecha=fecha ?? new Date();

        this.Fecha=fecha;
        this.fecha=fecha.getDate();
        
        // obtemenos el dia
        this.dia=fecha.toLocaleString(lang,{ weekday:'long'});
        this.diaCorto=fecha.toLocaleString(lang, {weekday: 'short'})
        this.diaNumero=fecha.getDay()+1;

        // Obtenemos el mes
        this.mes=fecha.toLocaleString(lang,{month:'long'});
        this.mesCorto=fecha.toLocaleString(lang,{month:'short'});
        this.mesNumero=fecha.getMonth()+1;

        //Obtenemos el año
        this.anio=fecha.getFullYear();
        this.anioCorto=Number(
            fecha.toLocaleString(lang,{year:'2-digit'})
        );

        this.estampaTemporal=fecha.getTime();
        this.semana=getNumeroSemana(fecha);
    }
    format(formatStr) {
        return formatStr
          .replace(/\bYYYY\b/, this.anio)
          .replace(/\bYYY\b/, this.anioCorto)
          .replace(/\bWW\b/, this.semana.toString().padStart(2, '0'))
          .replace(/\bW\b/, this.semana)
          .replace(/\bDDDD\b/, this.dia)
          .replace(/\bDDD\b/, this.diaCorto)
          .replace(/\bDD\b/, this.fecha.toString().padStart(2, '0'))
          .replace(/\bD\b/, this.fecha)
          .replace(/\bMMMM\b/, this.mes)
          .replace(/\bMMM\b/, this.mesCorto)
          .replace(/\bMM\b/, this.mesNumero.toString().padStart(2, '0'))
          .replace(/\bM\b/, this.mesNumero)
      }
}

class Mes{
    constructor(fecha=null, lang='default'){
        const dia=new Dia(fecha,lang),
            mesTamanio=[31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        this.lang=lang;

        this.nombre=dia.mes
        this.numeroMes=dia.mesNumero
        this.anio=dia.anio
        this.numeroDias=mesTamanio[this.numeroMes-1]

        // Verificamos si es año bisisto y aumentamos en 1 el valor de febrero
        if(this.numeroMes===2){
            this.numeroDias+=anioBisiesto(dia.anio)?1:0;
        }
        
        this[Symbol.iterator]= function*(){
            let numero = 1;
            yield this.obtenerDia(numero)
            while(numero<this.numeroDias){
                numero++;
                yield this.obtenerDia(numero)
            }
        }
    }
    obtenerDia(numero){
        return new Dia(new Date(this.anio, this.numeroMes-1,numero),this.lang)
        // return new Day(new Date(this.year, this.number - 1, date), this.lang);
    }
}

class Calendario{
    weekDays = Array.from({length: 7});

    constructor(anio=null,mesNumero=null,lang='default'){
        this.hoy=new Dia(null,lang)
        this.anio=anio ?? this.hoy.anio
        // console.log(this.anio,(mesNumero||this.hoy.mesNumero))
        this.mes=new Mes(new Date(this.anio, (mesNumero || this.hoy.mesNumero)-1), lang)
        this.lang=lang
        // console.log(this.mes.obtenerDia(1+1))
        this[Symbol.iterator]=function*(){
            let numero=1;
            yield this.obtenerMes(numero);
            while(numero<13){
                numero++;
                yield this.obtenerMes(numero)
            }
        }

        this.weekDays.forEach((_,i)=>{
            const day = this.mes.obtenerDia(i+1);
            if(!this.weekDays.includes(day.dia)){
               this.weekDays[day.diaNumero-1]=day.dia
            }
         })
    }
    get esAnioBisiesto(){
        return anioBisiesto(this.anio);
    }
    obtenerMes(mes){
        return new Mes(new Date(this.anio, mes-1),this.lang)
    }
}

class DatePicker extends HTMLElement{
    format='MMM DD, YYYY';
    position='bottom';
    visible=false;
    date=null;
    mounted=false;
    toggleButton=null;
    calendarDropDown=null;
    calendarDateElement=null;
    calendarDaysContainer=null;
    diasSeleccionados=[];

    constructor(){
        super();

        const lang=window.navigator.language;
        const date=new Date(this.date?? (this.getAttribute("date") || Date.now()));

        this.shadow=this.attachShadow({mode:'open'});
        this.date=new Dia(date, lang);
        this.calendar=new Calendario(this.date.anio, this.date.numeroMes, lang);
        this.format=this.getAttribute('format') ||this.format;
        this.position=DatePicker.position.includes(this.getAttribute('position'))? this.getAttribute('position'):this.position;
        this.visible=this.getAttribute('visible')===''
        || this.getAttribute('visible')==='true' 
        || this.visible

        this.render();
    }

    connectedCallback(){
        this.mounted=true;
        this.toggleButton=this.shadow.querySelector('.date-toggle');
        this.calendarDropDown=this.shadow.querySelector('.calendar-dropdown');
        this.calendarDaysContainer=this.calendarDropDown.querySelector('.month-days')

        this.calendarDateElement = this.calendarDropDown.querySelector('h4');
        const [prevBtn,calendarDateElement,nextButton]=this.calendarDropDown.querySelector('.header').children;
        this.calendarDateElement = calendarDateElement;
        
        this.toggleButton.addEventListener('click',()=>this.toggleCalendar());
        document.addEventListener('click',(e)=>this.handleClickOut(e));

        // this.getMonthDaysGrid();
        this.updateMonthDays();
        // this.renderCalendarDays();
    }
    handleClickOut(e) {
    if(this.visible && (this !== e.target)) {
        this.toggleCalendar(false);
    }
    }
    toggleCalendar(visible=null){
        if(visible===null){
            this.calendarDropDown.classList.toggle('visible');
        }else if(visible){
            this.calendarDropDown.classList.add('visible');
        }else {
            this.calendarDropDown.classList.remove('visible');
        }
        this.visible=this.calendarDropDown.className.includes('visible');
    }

    isCurrentCalendarMonth(){
        return this.calendar.mes.numero === this.date.numeroMes &&
        this.calendar.anio === this.date.anio
    }

    getWeekDaysElementStrings(){
        return this.calendar.weekDays
        .map(weekDay => `<span>${weekDay.substring(0, 3)}</span>`)
        .join('');
    }

    getMonthDaysGrid(){
        const firstDayOfTheMonth= this.calendar.mes.obtenerDia(1);
        
        const totalLastMonthFinalDays= firstDayOfTheMonth.diaNumero-1;
        const totalDays=this.calendar.mes.numeroDias +totalLastMonthFinalDays;
        const monthList= Array.from({length: totalDays});

        for(let i = totalLastMonthFinalDays; i<totalDays;i++){
            monthList[i]=this.calendar.mes.obtenerDia(i+1-totalLastMonthFinalDays)
        }
        return monthList;
    }

    updateMonthDays(){
        this.calendarDaysContainer.innerHTML=``;
        // console.log("test")
        this.getMonthDaysGrid().forEach(day=>{
            const el = document.createElement('button');
            el.className='month-day';
            el.addEventListener('click',e=>{
                if(el.classList.contains('selected')){
                    el.classList.toggle('selected');
                    this.diasSeleccionados.splice(this.diasSeleccionados.indexOf(el.textContent),1)
                    console.log(this.date.mes)
                    console.log(this.date.anio)
                }else{
                    el.classList.toggle('selected');
                    this.diasSeleccionados.push(el.textContent)
                }
                console.log(this.diasSeleccionados)
            })
            
            
            // console.log(day)
            if(day){
                el.textContent=day.fecha
            }
            this.calendarDaysContainer.appendChild(el);
        })
    }


    static get position(){}

    static get position(){
        return ['top','left','bottom','right'];
    }

    get style(){
        return `
            :host{
                position:relative;
                font-family: sans-serif;
            }
            .date-toggle{
                padding: 8px 15px;
                border: none;
                -webkit-appearance: none;
                -moz-appearance: none;
                appearance:none;
                background: #eee;
                color: #333;
                border-radius:6px;
                font-weight: bold;
                cursor: pointer;
                text-transform: capitalize;
            }
            .calendar-dropdown{
                display: none;
                width:300px;
                // height: 300px;
                position: absolute;
                top: 100%;
                left: 50%;
                transform: translate(-50%, 8px);
                padding: 20px;
                background: #fff;
                border-radius: 5px;
                box-shadow: 0 0 8px rgba(0,0,0,0.2);
            }
            
            .calendar-dropdown.visible{
                display: block;
            }

            .header{
                display:flex;
                justify-content: space-between;
                align-items: center;
                margin: 10px 0 30px
            }

            .header h4{
                margin: 0;
                text-transform: capitalize;
                font-size: 21px;
                font-weight: bold;
            }

            .header button{
                padding: 0;
                border: 8px solid transparent;
                width: 0;
                height:0;
                border-radius:2px;
                border-top-color: #222;
                transform: rotate(90deg);
                cursor: pointer;
                background: none;
                position: relative;
            }

            .header button::after{
                content:'';
                display: block;
                width: 25px;
                height: 25px;
                position: abosulte;
                left: 50%;
                top: 50%;
                tranform: translate(-50%,-50%);
                
            }

            .header button:last-of-type{
                transform:rotate(-90deg)
            }

            .week-days{
                display: grid;
                grid-template-columns: repeat(7,1fr);
                grid-gap: 5px;
                margin-bottom: 10px;
            }

            .week-days span{
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 10px;
                text-transform: capitalize;
            }

            .month-days{
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                grid-gap:5px;
            }

            .month-day{
                display: none;
                padding: 8px 5px;
                background: #c7c9d3;
                color:#fff;
                display:flex;
                justify-content: center;
                align-items:center;
                border-radius: 2px;
                cursor: pointer;
                border:none;
                background:#444857;
            }

            .month-day:hover{
                background:rgb(19, 103, 237);
            }

            .month-day.selected{
                background:rgb(19, 103, 237);
            }

        `;
    }

    render(){
        const monthYear= `${this.calendar.mes.nombre}, ${this.calendar.anio}`
        const date=this.date.format(this.format)
        this.shadow.innerHTML=`
        <style>${this.style}</style>
        <button type="button" class="date-toggle">${date}</button>
        <div class='calendar-dropdown ${this.visible ?'visible':''} ${this.position}'>
            <div class="header">
                <button type="button" class="prev-month" aria-label="previous month"></button>
                <h4>
                ${monthYear}
                </h4>
                <button type="button" class="prev-month" aria-label="previous month"></button>
            </div>
            <div class="week-days">${this.getWeekDaysElementStrings()}</div>
            <div class="month-days"></div>
        </div>
        `
    }
}

customElements.define("date-picker",DatePicker);

const $btn=document.getElementById('botonTest');

$btn.addEventListener('click',e=>{
    const $picker=document.getElementById('picker');
    console.log($picker.diasSeleccionados)
    alert("Funciona")
})
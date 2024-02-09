class CFchart {
    constructor(container, ohlc_data) {
        this.container = typeof container === 'string'? document.querySelector(container) : container;
        this.createUtilities()
        this.ohlc = this.U.formatData(ohlc_data);
		this.info = {symbol: 'SPY'}
        this.min = Math.min(...this.ohlc.low)
        this.max = Math.max(...this.ohlc.high)
		this.newMin = this.min
		this.newMax = this.max
		this.font = { size:13, family: `'Roboto', Arial, sans-serif` }
        
        this.color = { 
            b1: 'hsl(224, 28%, 17%)', 
            b2:'hsl(220, 25%, 50%)', 
            b3: 'hsl(224, 20%, 15%)', 
            crossHairColor:'white',
            line: 'hsl(225, 18%, 28%)', 
            line2: 'gray', 
            infoBoxColor: 'rgba(150,150,150,.3)', 
            textColor1: 'white', 
			upCandle: 'hsl(165,75%,40%)', 
            downCandle: 'hsl(1,83%,63%)', 
            list: [
                '#ff9999','#ff6666','#ff3333','#ff0000','#cc0000','#990000','#660000',
                '#fff099','#ffe866','#ffe033','#ffd900','#ccad00','#998200','#665700',
                '#b8ff99','#94ff66','#70ff33','#4dff00','#3dcc00','#2e9900','#1f6600',
                '#99ffd3','#66ffbd','#33ffa7','#00ff91','#00cc74','#009957','#00663a',
                '#99d5ff','#66bfff','#33aaff','#0095ff','#0077cc','#005999','#003c66',
                '#b699ff','#9166ff','#6d33ff','#4800ff','#3a00cc','#2b0099','#1d0066',
                '#ff99f1','#ff66eb','#ff33e4','#ff00dd','#cc00b1','#990085','#660058',
                '#ffffff','#b3b3b3','#808080','#666666','#4d4d4d','#333333','#000000',
            ],
            order: 0,
            getColor: () => {
                const colorThreshold = 70; // threshold for color difference
                let color;
            
                do {
                    if (!this.color.unusedColors || this.color.unusedColors.length === 0) {
                        this.color.unusedColors = this.color.list.slice(0, -5); // Exclude the last five colors
                        this.color.unusedColors.sort(() => Math.random() - 0.5); // Shuffle the array
                        this.color.order = 0;
                    }
            
                    if (this.color.order >= this.color.unusedColors.length) {
                        this.color.order = 0;
                    }
            
                    color = this.color.unusedColors[this.color.order];
                    this.color.order++;
                } while (this.color.lastColor && this.U.colorDifference(this.color.lastColor, color) < colorThreshold);
            
                this.color.lastColor = color;
                return color;
            }
		}
        let bol = Math.max(...this.ohlc.close) > 0
        this.d = {
            'draw':bol,'marginTop':5,'inframeCandleIndex':0, 'candleIdx':0, 'isDragging': false, 'doubleTap': false,
            'offsetX':0,'offsetY':0,'ttlDelta':0, 'candleWidthFactor': .65, 'initialXGap':1, 'event':{},
            'deltaX':0, 'deltaY':0, 'scaleX':1 , 'scaleY':1,'preIdx':0, 'candleWidth' :0,
            'scaleLimit': Math.max(this.ohlc.close.length / 8, 35),
            'debounceReset':0,'debounceCount':0,'deltaXSum':0,'deltaYSum':0,'dX':0,'dY':0,
            'verticalDrag':true,'horizontalDrag':true,'openedIndicator':'','touchDeltaFactor':1,
            'multiTouchDeltaX': null, 'multiTouchRangeX': null, 'longPress': false, 
            'crossHairOffsetX':null, 'crossHairOffsetY':null, 'crossHairTarget': null, 'selectedColorBox':null
        }

		this.align = { left: 0, center: 0, right: 0 }
		this.xInterval = []
		this.yInterval = []
		this.inFrameCandles = []
		this.xPositions = [{x:0}]
        this.margin = { t:50, b:10, l: 5, r: 5 }
        this.lowerChartMargin = { t:10, b:10, l: 5, r: 5 }
        
        // this.indicators = new this.U.Obj()
        this.plotOptions = {
            plotType: [
                `<option value="line">Line</option>`,
                `<option value="dash">Dash</option>`,
                `<option value="square">Square</option>`,
                `<option value="point">Point</option>`,
                `<option value="histogram">Histogram</option>`,
                `<option value="up-arrow">Up arrow</option> `,
                `<option value="down-arrow">Down arrow</option> `,
                `<option value="up-triangle">Up triangle</option> `,
                `<option value="down-triangle">Down triangle</option> `,
                `<option value="dashed-line-short">Short dashed line</option> `,
                `<option value="dashed-line-long">Long dashed line</option> `,
                `<option value="line point">Line point</option> `,
                `<option value="line square">Line square</option> `,
            ],
            priceType: [
                `<option value="open">Open</option>`,
                `<option value="high">High</option>`,
                `<option value="low">Low</option>`,
                `<option value="close">Close</option>`,
            ],
            level:[ 
                `<option value="upper">Upper</option>`,
                `<option value="lower">Lower</option>`
            ]
        }
        this.static = {windowWidth: window.innerWidth}
        this.U.edit_HTM_head()
        this.indicatorsFormulas = this.U.indicatorsFormulas()
        this.U.createChart()
        //searchSymbol
        this.U.searchSymbol(this.info.symbol)
        this.U.setCSS()
        this.U.setStockInputEvents()
    }
    
    createUtilities(){
        function typeNum(n, obj={}) {
            const { exeption } = obj
            if (typeof n !== 'number' || n === null || isNaN(n)) {
                if('exeption' in obj && n == exeption){
                    console.error('Value not a valid number:', n);
                    return n
                }
                console.error('Value not a valid number:', n);
                return n;
            }
            return n;
        }
        function typeStr(str){
            if(typeof str !== 'string'){
                console.error('value not type string',str)
                return null
            }
            return str
        }
        const utilities = {
            // 'addIndicator':(indicator)=>{
            //     this.indicators.list[indicator['nameId']] = indicator
            //     if(indicator.inputs.level === 'upper'){
            //         this.U.addStudyInfoBox(indicator)
            //         indicator.ctx = this.canvas_main.ctx
            //         indicator.chartHeigh = this.chart_height
            //     }
            //     if(indicator.inputs.level === 'lower'){
            //         this.U.ajustChartSizes()
            //         this.U.createLowerIndicatorCanvas(indicator)
            //         indicator.ctx = this[`canvas_${indicator.nameId}`].ctx
            //         indicator.chartHeigh = this.lower_chart_height
            //         this.U.setDimentions()
            //     }
            //     this.indicators.updatePlots()
            // },
            // 'addStudyInfoBox':(study, el = null)=>{
            //     const infoBox = el ? el : this.U.s('#studyInfoBox')
            //     const div = document.createElement('div')
        
            //     const name = study.shortName ?? study.nameId
            //     const idNumber = '_'+study.id
            //     infoBox.append(div)
            //     div.id = `${study.nameId}_div`
            //     div.dataset.action = `run-openStudySettings-${study.nameId}`
            //     div.classList.add('actionBtn', 'infoBox', 'dontRun')
            //     div.innerHTML = `
            //         <p id="${study.nameId}_p" class="color1 dontRun" style="margin: 0 0 0 8px;">${name}</p>
            //     `
                
            //     Object.keys(study.data).forEach(ind=>{
            //         const p = document.createElement('p')
            //         infoBox.querySelector(`#${study.nameId}_p`).after(p)
            //         let val = study.data[ind].at(-1)
            //         p.innerText = this.U.formatPrice(val)
            //         p.classList.add('pdata', `${ind + idNumber}`, 'number', 'ml',  'dontRun')
            //         !study.plots[ind].showPlot && p.classList.add('dn') //hide if showPLot is false
            //         p.dataset.info = `{ "group": "${study.nameId}", "name": "${ind}" }`
            //         p.style = `color: ${study.plots[ind].color}; margin: 0 0 0 8px;`
            //         study.htmlEls[ind] = p
            //     })
                
            //     infoBox.style.display = 'inline-flex'
            //     this.U.handleBtn()
            // },
            'ajustChartSizes':()=>{
                //ajustChartSizes
                const d = this.d
                let ttlChartHeight = d.frameHeight - d.toolbarHeight - d.xAxisHeight 
                let lowerIndicatorsCount = this.indicators.getIndicatorType(['lower']).length
        
                const amount = {'1':.3, '2':.4}
                let n = amount[lowerIndicatorsCount] || .5
                let lowerChartheight = (ttlChartHeight * n) / lowerIndicatorsCount
                let newHeight = ttlChartHeight * (1-n)
                let ttl = newHeight + (lowerChartheight * lowerIndicatorsCount)
        
                if(lowerIndicatorsCount == 0){
                    newHeight = ttlChartHeight
                    lowerChartheight = 0
                    ttl = newHeight + (lowerChartheight * lowerIndicatorsCount)
                }
        
                this.chart_height = newHeight
                this.lower_chart_height = lowerChartheight
        
                this.U.s('canvas').forEach(chart => {
                    if(chart.id.startsWith('canvas_x')){ return }
                    if(['canvas_background', 'canvas_top'].includes(chart.id) ){ return }
                    this[chart.id].height = chart.id.includes('main') ? newHeight : lowerChartheight
                });
                this.U.setDimentions()
            },
            'clearAllChartCanvas':(arr = ['chart', 'Y_chart','X_chart'])=>{
                arr.forEach(v=>{
                    this.U.s(`.${v}`).forEach(c=>{
                        const ctx = c.getContext('2d')
                        const dimentions = this.U.r(c)
                        ctx.clearRect(0,0, dimentions.width, dimentions.height)
                    })
                })
            },
            'createChart':()=>{
                this.U.identifyMarketZones()
                const d = this.d
                d.frameHeight = window.innerHeight
                d.toolbarHeight = 45
                d.xAxisHeight = 40
                let intervalOptions = '' //`<select>${['1min','5min','30min'].reduce((acu,cur)=>{ return acu + `<option>${cur}</option>` },'')}</select>`
                let gearBtn = '' // `<span class="material-symbols-outlined btn1 actionBtn" data-action="run-logInfo">settings</span>`
                let indicatorBtn = '' // `<button class="btn1 actionBtn dontRun" data-action="run-showIndicatorsList" >Indicators </button>`
                this.container.innerHTML = `
                    <div id='frame' class="parent" style="position:relative; height: ${d.frameHeight}px; max-height: ${d.frameHeight}px; background-color: ${this.color.b1}; margin: auto; font-size:${this.font.size}px; font-family:${this.font.family};" >
                        <canvas id="canvas_background" class="chart resize" style="position:absolute; top:${d.toolbarHeight}px;"></canvas>
                        <canvas id="canvas_top" class="chart resize ignore-js-events" style="position:absolute; z-index:20; top:${d.toolbarHeight}px;"></canvas>
                        <div id="toolsBar" class="bd-b scrollbar0" style="min-height:${d.toolbarHeight}px; height:${d.toolbarHeight}px;">
                            <form id="seachBarForm">
                                <input class="test" type="text" id="stock-input" value="${this.info.symbol}">
                            </form>
                            ${intervalOptions}
                            ${indicatorBtn}
                            <p style="color:white; position:absolute; right:20px; top: 15px;">Made By Carlos Febres</p>
                            ${gearBtn}
                            
                        </div>
                        <div id="mainChart_div" class="flexHeight" style=" position: relative;">
                            <span id="scrollBtn" class="actionBtn df jcc ani" data-action="run-showRecentCandle" >
                                <span class="material-symbols-outlined">fast_forward</span>
                            </span>
                            <table>
                                <tbody>
                                    <tr>
                                        <td id="canvas_main_td">
                                            <div id="chart_div" class="wresize" style="overflow: hidden; position:relative; width:${this.chart_width}px; height:min-content;">
                                                <canvas id="canvas_main" class="chart resize" style="position:relative; z-index:10; "> </canvas>
                                            </div>
                                        </td>
                                        <td id="canvas_main_yAxis_td" class="min bd-l">
                                            <canvas id="canvas_main_yAxis" class="Y_chart"></canvas>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div id="xAxis_div" class="bd-t" style="min-height:40px; z-index: 10; background-color: ${this.color.b1};">
                            <table>
                                <tbody>
                                    <tr class="bd-t">
                                        <td id="canvas_xAxis_td" class="min bd-r" style="padding: 0px;">
                                            <div id="x_div" class="wresize" style="overflow: hidden; width: ${this.chart_width}px; height: 40px;">
                                                <canvas id="canvas_xAxis" class="resize"></canvas>
                                            </div>
                                        </td>
                                        <td class="bd-l"> </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                `
                
                this.chart_width_yAxis = 55
                this.chart_width = this.U.prepContainer() - this.chart_width_yAxis
                this.chart_height = window.innerHeight - d.xAxisHeight - d.toolbarHeight
                this.lower_chart_height = 0
        
                this.U.s('canvas').forEach(c=>{
                    this[c.id] = {}
                    this[c.id].ctx = c.getContext('2d')
                    this[c.id].getWidth = this.U.getWidth.bind({id:c.id, parent: this}) 
                })
                
                this.canvas_main_yAxis.width = this.chart_width_yAxis
                this.canvas_main_yAxis.height = this.chart_height
                this.canvas_xAxis.height = d.xAxisHeight
                this.canvas_top.height = d.frameHeight
                this.canvas_background.height = d.frameHeight
        
                this.marginX = this.U.Mf(this.U.r(this.container).width * ((this.margin.l*2)/100))
                this.U.setDimentions()
        
                d.leftBound = 0
                d.rightBound = this.d.wd
        
                this.ctx = this.U.s('#canvas_main').getContext('2d'); 
                this.U.setCandles()
                this.U.setCandlesAndWicks()
                this.U.createUpperInfoBox()
                // this.U.createStudiesBtnEls()
                this.U.createDinamicDiv()
                this.U.onResize()
                this.U.onWheel()
                this.U.onClick() 
                this.U.onMouseMove()
                this.U.handleBtn()
                this.U.handleRightCLick()
        
                this.U.draw('createChart')
        
                //addstudy
                // this.U.createIndicator('TwoMovAvg')
                // this.U.createIndicator('Volume')
                // this.U.createIndicator('MACD')
            },
            'createDinamicDiv':()=>{
                this.dinamicDiv = document.createElement('div')
                this.container.append(this.dinamicDiv)
                this.dinamicDiv.id = "dinamicDiv"
                this.dinamicDiv.classList.add('hide_when_outside_click')
                this.dinamicDiv.innerHTML =`
                    <div class="df jcsb pd" style="padding:10px 1.3rem ;">
                        <h3 class="title color1 text1">.title</h3>
                        <button id="dinamicDiv-xButton" class="btn1 actionBtn"  data-action="closeDinamicDiv">X</button>
                    </div>
                    <div class="pb bd-b bd-t scrollbar0" id="divContent" 
                        style="overflow-y: scroll;">
                    </div>
                    <div id="submit" class="df pt pb">
                        <button id="cancel-btn" class="btn1 actionBtn" data-action="closeDinamicDiv" style="padding:5px 10px">Cancel</button>
                        <button id="done-btn" class="btn1 actionBtn" data-action="run-updateIndicator closeDinamicDiv" style="padding:5px 10px">Done</button>
                    </div>
                `
                const div = document.createElement('div')
                div.id = 'mesageDiv'
                this.container.append(div)
                this.U.handleBtn()
            },
            // 'createIndicator':(study)=>{
            //     let count = Object.keys(this.indicators.list).filter(v => v.startsWith(study)).length;
            //     const indicator = this.indicatorsFormulas[study]();
            //     indicator['id'] = count + 1; 
            //     indicator['nameId'] = `${study}_id_${indicator['id']}`;
            //     this.U.addIndicator(indicator);
            //     this.U.draw('createIndicator');
            // },
            // 'createLowerIndicatorCanvas':(indicator)=>{
            //     const group = indicator.nameId
            //     const minMax = Object.values(indicator.data).flat().reduce((acc, current) => {
            //         return {
            //             min: Math.min(acc.min, current ),
            //             max: Math.max(acc.max, current )
            //         };
            //     }, { min: Infinity, max: -Infinity });
        
            //     this[`canvas_${group}`]={
            //         'height':this.lower_chart_height, 
            //         'getWidth':this.U.getWidth.bind({id:`canvas_${group}`,parent:this}),
            //         'min':minMax.min,
            //         'max':minMax.max
            //     }
            //     this[`canvas_${group}_yAxis`]={
            //         'height':this.lower_chart_height,
            //         'getWidth':this.U.getWidth.bind({id:`canvas_${group}_yAxis`, parent: this})
            //     }
        
            //     const newRow = document.createElement('div')
            //     newRow.id = `canvas_${group}_row`
            //     newRow.innerHTML = `
            //         <table>
            //             <tr>
            //                 <td class="min bd-r" style="padding: 0px;">
            //                     <canvas id="canvas_${group}" class="chart resize wresize"></canvas>
            //                 </td>
            //                 <td><canvas id="canvas_${group}_yAxis" class="Y_chart"></canvas></td>
            //             </tr>
            //         </table>
            //     `
            //     const rows = this.U.s('#frame').children
            //     this.U.s('#frame').children[rows.length-1].before(newRow)
            //     newRow.classList.add('bd-t2')
            //     const td = newRow.children[0]
            //     td.style.position = 'relative'
            //     const infoBox = document.createElement('div')
            //     td.append(infoBox)
        
            //     this.U.addStudyInfoBox(indicator, infoBox)
            //     infoBox.style = `
            //         position:absolute; display:inline-flex; width:min-content; 
            //         height:min-content; top:10px; left:10px; border-radius: 3px;
            //     `
            //     this[`canvas_${group}`].ctx = this.U.s(`#canvas_${group}`).getContext('2d')
            //     this[`canvas_${group}_yAxis`].ctx = this.U.s(`#canvas_${group}_yAxis`).getContext('2d')
            //     this.U.handleBtn()
            // },
            // 'createStudiesBtnEls':()=>{
            //     this.indicatorsBtns = {}
            //     for (let study of Object.keys(this.indicatorsFormulas)){
            //         this.indicatorsBtns[study] = document.createElement('button')
            //         this.indicatorsBtns[study].name = study
            //         this.indicatorsBtns[study].classList.add('studies_btn','btn1')
            //         this.indicatorsBtns[study].dataset.study_placement = "lower"
            //         this.indicatorsBtns[study].innerText = study
        
            //         this.indicatorsBtns[study].addEventListener('click', ()=>{
            //             this.U.createIndicator(study)
            //         })
            //     }
            // },
            'createUpperInfoBox':()=>{
                const infoBox = document.createElement('div')
                this.U.s('#chart_div').append(infoBox)
                infoBox.id = 'upperInfoBox'
                infoBox.innerHTML = `
                    <p>O</p><p class="pdata _open">${this.ohlc.open ? this.ohlc.open.at(-1):0}</p>
                    <p>H</p><p class="pdata _high">${this.ohlc.high ? this.ohlc.high.at(-1):0}</p>
                    <p>L</p><p class="pdata _low">${this.ohlc.low ? this.ohlc.low.at(-1):0}</p>
                    <p>C</p><p class="pdata _close">${this.ohlc.close ? this.ohlc.close.at(-1):0}</p>
                    <p>V</p><p class="pdata _volume">${this.ohlc.volume ? this.ohlc.volume.at(-1):0}</p>
                `
                infoBox.querySelectorAll('p.pdata').forEach(el=>el.style.color = this.candles.at(-1).color)
                const studyInfoBox = document.createElement('div')
                this.U.s('#chart_div').append(studyInfoBox)
                studyInfoBox.id = 'studyInfoBox'
                studyInfoBox.classList.add('scrollbar0')
                studyInfoBox.style.display = 'none'
            },
            'draw':(obj = null)=>{
                if(!this.d.draw){return}
                const drawing = ()=>{
                    this.U.clearAllChartCanvas()
                    this.U.updateInframeCandles()
                    this.U.updateValues()
                    this.U.updateYIntervals();
                    this.U.drawVerticalLines()
                    this.U.drawHorizontalLines()
                    this.U.drawClosedMarketBackground()
                    this.U.drawClouds()
                    this.inFrameCandles.forEach((val, idx )=>{
                        this.U.drawPlots({ i:idx, plot: { 'candleType':'candle', 'show':true, } })
                        // this.U.drawIndicators(idx)
                    })
                    // this.U.drawDashedLinePlots()
                    this.U.draw_X_axis()
                    this.U.draw_Y_axis()
                    this.U.drawCrossHair()
                    // this.U.updateDataBoxes(this.d.candleIdx);
                    this.U.draw_x_axis_info()
                    this.U.draw_y_axis_info()
                }
                requestAnimationFrame(drawing)
            },
            'drawCrossHair':()=>{
                const d = this.d;
                if (!d.longPress || !d.event.target || !d.event.target.classList.contains('chart')) {
                    return;
                }
                d.preIdx = d.eventType === 'mousemove' ? d.inframeCandleIndex : d.preIdx;
                this.U.drawCrossHairLine(canvas_top, d.crossHairOffsetX, 0, d.crossHairOffsetX, d.frameHeight);
                this.U.drawCrossHairLine(d.crossHairTarget, 0, d.crossHairOffsetY, this.chart_width, d.crossHairOffsetY);
                d.candleIdx = this.U.getDataCandleIndex(d.crossHairOffsetX);
            },
            'drawHorizontalLines':()=>{
                this.ctx.fillStyle = this.color.line;
                this.yInterval.forEach(v=>{
                    this.ctx.fillRect(
                        this.align.left, // x
                        v.y, // y
                        this.chart_width, // width
                        1, // height
                    );
                })
            },
            'drawVerticalLines':()=>{
                const c = this.U.s('#canvas_background')
                const ctx = c.getContext('2d')
                ctx.fillStyle = this.color.line;
                this.xInterval.forEach(v=>{
                    ctx.fillRect(
                        v.x , // x
                        0, // y
                        1, // width
                        this.U.r(c).height, // height
                    );
                })
            },
            'edit_HTM_head':()=>{
                const head = document.getElementsByTagName('head')[0];
                const lines =[
                    { 'href':'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0' },
                ]
                lines.forEach(line =>{
                    const newLine = document.createElement('link');
                    newLine.href = line.href;
                    newLine.rel = "stylesheet"
                    head.appendChild(newLine);
                })
            },
            'formatData':(data)=>{
                const exeptions = ['open','high','low','close','volume','date']
                const dic = {}
                if(data){
                    for(let key of Object.keys(data[0])){
                        const newKey = !exeptions.includes(key) ? key[0].toUpperCase()+key.slice(1) : key
                        dic[newKey] = data.map(v=>v[key]==null? 0: this.U.typeNum(v[key]))
                    }
                    return dic
                }
                for (let key of exeptions){
                    dic[key] = Array(100).fill(0)
                }
                return dic
            },
            'getAllCtx':()=>{
                return Object.keys(this).filter(v=>v.includes('canvas')).map(key => this[key]?.ctx)
            },
            'getInframeCandlesIndex':(offsetX)=>{
                const isLeftMostCandle = this.inFrameCandles[0].i == 0
                const isRightMostCandle = this.inFrameCandles.at(-1).i == this.ohlc.close.length -1
                let gap = this.d.xGap /2
                let idx = this.inFrameCandles.findIndex(v=> offsetX >=(v.x-gap) && offsetX <= (v.x+gap))
                if(offsetX <= this.inFrameCandles[0].x && isLeftMostCandle){
                    idx = 0
                }
                if(offsetX >= this.inFrameCandles.at(-1).x && isRightMostCandle){
                    idx = this.inFrameCandles.length -1
                }
                idx = idx < 0 ? this.inFrameCandles.length -1 : idx
                return idx
            },
            'getDataCandleIndex':(offsetX)=>{
                let gap = this.d.xGap /2
                let idx = this.inFrameCandles.find(v=> offsetX >=(v.x-gap) && offsetX <= (v.x+gap))
                idx = idx ? idx.i : -1
                return idx
            },
            'getOuterCandlesIndex':()=>{
                const d = this.d
                d.rightIndex = this.xPositions.at(-1).i
                d.leftIndex = this.xPositions.findIndex(v=> v.x > this.xPositions.at(-1).x - d.wd )
                return {left:d.leftIndex, right:d.rightIndex}
            },
            'getWidth': function(){ 
                const {id, parent} = this
                const condition = id == 'canvas_main' || id == 'canvas_upperStudies'
                if(condition){parent[id].height = parent.chart_height}
                const val = parent[id].hasOwnProperty('width') ? parent[id].width : parent.chart_width
                return val
            },
            'handleBtn':()=>{
                const actionMethods = {
                    'run': (act) => { 
                        if (this.U[act[1]]) { this.U[act[1]](act[2]) } 
                        else {console.error(act,'not found')}
                    },
                    'closeDinamicDiv':()=>{
                        this.dinamicDiv.name = ''; 
                        this.dinamicDiv.style.display = "none" 
                    },
                    'showColors':(act, ev)=>{
                        this.d.selectedColorBox = ev.target
                        this.U.s('.dropDown-container')[0].style.display = 'flex'
                    },
                    'selectColor':(act, ev)=>{
                        if(!ev.target.classList.contains('menu-option-color')){return}
                        this.d.selectedColorBox.setAttribute('value',ev.target.getAttribute('value'))
                        this.d.selectedColorBox.style.backgroundColor = ev.target.getAttribute('value')
                        this.U.s('.dropDown-container')[0].style.display = 'none'
                    }
                }
                this.U.s('.actionBtn').forEach(btn=>{
                    if(btn.getAttribute('data-event') == null){
                        btn.dataset.event = true
                        btn.addEventListener('click', ev =>{
                            this.U.clearLongPressTimer()
                            const actions = btn.getAttribute('data-action').split(' ')
                            actions.forEach((action)=>{
                                const act = action.split('-')
                                if(!act[0].length){ return }
                                actionMethods[act[0]](act, ev)
                            })
                        })
                    }
                })
            },
            'handleRightCLick':()=>{
                this.U.s('canvas').forEach(chart=>{
                    chart.addEventListener("contextmenu", function (e) {
                        e.preventDefault(); // Prevent the default context menu behavior
                    });
                })
            },
            'handleTouch':(ev, touchHandler)=>{
                if(ev.target.tagName != 'CANVAS'){return}
                if ( ev.touches.length == 1 && !this.d['doubleTap']){ 
                    this.d['isDragging'] = true
                } 
                else if ( ev.touches.length == 2 && !this.d['doubleTap']){ 
                    this.d['isDragging'] = false
                }
                this.U[touchHandler](ev)
            },
            'indicatorsFormulas':()=>{

                const formulas = {
                    EMA: (obj) => {
                        let { data, priceType, period } = obj;
                        period = typeNum(period)
                        priceType = !data ? typeStr(priceType) : priceType
                        data = data || this.ohlc[priceType];
                        if (data.length < period) { return {ema:Array(data.length).fill(null)} }
                        const emaArray = [];
                        let ema = null; 
                        for (let i = 0; i < data.length; i++) {
                            if (i < period - 1) {
                                emaArray.push(null);
                            } else if (i === period - 1) {
                                ema = data.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
                                emaArray.push(ema);
                            } else {
                                ema = (data[i] - ema) * (2 / (period + 1)) + ema;
                                emaArray.push(ema);
                            }
                        }
                        return {ema:emaArray};
                    },
                    SMA: (obj) => {
                        let { data, priceType, period } = obj;
                        period = typeNum(period)
                        priceType = !data ? typeStr(priceType) : priceType
                        data = data || this.ohlc[priceType];
                        if (data.length < period) { return { sma:Array(data.length).fill(null)} }
                            const smaArray = [];
                            for (let i = 0; i < data.length; i++) {
                            if (i < period - 1) {
                                smaArray.push(null);
                            } else {
                                const sma = data.slice(i - period + 1, i + 1).reduce((sum, price) => sum + price, 0) / period;
                                smaArray.push(sma);
                            }
                        }
                        return {sma:smaArray};
                    },
                    TwoMovAvg: (obj) => {
                        let { MovAvgType, data, priceType, shortPeriod, longPeriod} = obj
                        shortPeriod = typeNum(shortPeriod)
                        longPeriod = typeNum(longPeriod)
                        priceType = !data ? typeStr(priceType) : priceType
                        data = data || this.ohlc[priceType];
                        const shortMAArray = Object.values(formulas[MovAvgType]({data:data, period:shortPeriod}))[0];
                        const longMAArray = Object.values(formulas[MovAvgType]({data:data, period:longPeriod}))[0]
                        if (data.length < longPeriod) {
                            return {
                                fastAvg: Array(data.length).fill( null ),
                                slowAvg: Array(data.length).fill( null )
                            };
                        }
                        return {fastAvg:shortMAArray, slowAvg:longMAArray};
                    },
                    MACD: (obj) => {
                        let { data, priceType, shortPeriod, longPeriod, signalPeriod } = obj
                        shortPeriod = typeNum(shortPeriod)
                        longPeriod = typeNum(longPeriod)
                        signalPeriod = typeNum(signalPeriod)
                        priceType = !data ? typeStr(priceType) : priceType
                        data = data || this.ohlc[priceType];

                        const shortEMAArray = formulas.EMA({data:data, period:shortPeriod}).ema;
                        const longEMAArray = formulas.EMA({data:data, period:longPeriod}).ema;
                        const MACD = []
                        const Signal = []

                        if (data.length < longPeriod) {
                            return { 
                                MACD: Array(data.length).fill(null), 
                                Signal: Array(data.length).fill(null) 
                            };
                        }
                        
                        for (let i = 0; i < data.length; i++) {
                            if (i < longPeriod - 1) {
                                MACD.push(null)
                                Signal.push(null)
                            } else {
                                const MACDLine = shortEMAArray[i] - longEMAArray[i];
                                if (i >= longPeriod + signalPeriod - 2) {
                                    const signalData = MACD.slice(0, i + 1);
                                    const signalLine = formulas.EMA({data:signalData, period:signalPeriod}).ema;
                                    Signal.push(signalLine[signalLine.length - 1])
                                    MACD.push(MACDLine)
                                } else {
                                    MACD.push(MACDLine)
                                    Signal.push(null)
                                }
                            }
                        }
                        return {MACD:MACD, Signal:Signal};
                    },
                    RSI: (obj) => {
                        let { data, priceType, period, overBought, overSold  } = obj;
                        period = typeNum(period);
                        overBought = typeNum(overBought);
                        overSold = typeNum(overSold);
                        data = data || this.ohlc[priceType];
                        
                        if (!data) return { 'rsi': [], 'overBought': [], 'overSold': [] };
                        if (data.length <= period) {
                            return { 
                                'rsi': Array(data.length).fill(null), 
                                'overBought': Array(data.length).fill(null), 
                                'overSold': Array(data.length).fill(null)
                            }
                        }
                    
                        let gain = 0;
                        let loss = 0;
                        const rsArray = Array(period - 1).fill(null); // Initialize with nulls for the period where RSI can't be calculated
                        const overBoughtArray = Array(data.length).fill(overBought); // Fill the entire array with the overBought value
                        const overSoldArray = Array(data.length).fill(overSold); // Fill the entire array with the overSold value
                    
                        for (let i = 1; i < period; i++) {
                            const change = data[i] - data[i - 1];
                            if (change >= 0) gain += change;
                            else loss += Math.abs(change);
                        }
                        let rs = gain / loss;
                        rsArray.push(100 - (100 / (1 + rs)));
                    
                        for (let i = period; i < data.length; i++) {
                            const change = data[i] - data[i - 1];
                            if (change >= 0) {
                                gain = ((gain * (period - 1)) + change) / period;
                                loss = (loss * (period - 1)) / period;
                            } else {
                                gain = (gain * (period - 1)) / period;
                                loss = ((loss * (period - 1)) + Math.abs(change)) / period;
                            }
                            rs = gain / loss;
                            rsArray.push(100 - (100 / (1 + rs)));
                        }
                    
                        return {'rsi': rsArray, 'overBought': overBoughtArray, 'overSold': overSoldArray};
                    },
                    StochasticOscillator: (obj) => {
                        let { data, priceType, period } = obj
                        period = typeNum(period)
                        priceType = !data ? typeStr(priceType) : priceType
                        data = data || this.ohlc[priceType];

                        if (data.length <= period){
                            return {stOs: Array(data.length).fill(null)}
                        }

                        const stochArray = [];
                        for (let i = 0; i < data.length; i++) {
                            if (i < period - 1) {
                                stochArray.push(null);
                            } else {
                                const highArray = data.slice(i - period + 1, i + 1);
                                const lowArray = data.slice(i - period + 1, i + 1);
                                const highest = Math.max(...highArray);
                                const lowest = Math.min(...lowArray);
                                const stoch = ((data[i] - lowest) / (highest - lowest)) * 100;
                                stochArray.push(stoch);
                            }
                        }
                        return {stOs:stochArray};
                    },
                    BollingerBands: (obj) => {
                        let { data, priceType, period , factor } = obj
                        period = typeNum(period)
                        priceType = !data ? typeStr(priceType) : priceType
                        data = data || this.ohlc[priceType];

                        if (data.length <= period){
                            return {
                                Upper: Array(data.length).fill(null),
                                Middle: Array(data.length).fill(null),
                                Lower: Array(data.length).fill(null),
                            }
                        }

                        const smaArray = formulas.SMA({'data': data, 'period': period}).sma;
                        const upperArray = [];
                        const middleArray = [];
                        const lowerArray = [];
                        for (let i = 0; i < data.length; i++) {
                            if (i < period - 1) {
                                upperArray.push(null);
                                middleArray.push(smaArray[i]);
                                lowerArray.push(null);
                            } else {
                                const slice = data.slice(i - period + 1, i + 1);
                                const stdDev = Math.sqrt(slice.reduce((acc, price) => acc + Math.pow(price - smaArray[i], 2), 0) / period);
                    
                                upperArray.push(smaArray[i] + (factor * stdDev));
                                middleArray.push(smaArray[i]);
                                lowerArray.push(smaArray[i] - (factor * stdDev));
                            }
                        }
                        return {
                            Upper: upperArray,
                            Middle: middleArray,
                            Lower: lowerArray
                        };
                    },
                    ATR: (obj) => {
                        let { data, priceType, period} = obj
                        period = typeNum(period)
                        priceType = !data ? typeStr(priceType) : priceType
                        data = data || this.ohlc[priceType];

                        if (data.length <= period){
                            return {atr: Array(data.length).fill(null)}
                        }

                        data = data.map((value, index) => ({
                            high:this.ohlc.high[index],
                            low: this.ohlc.low[index],
                            close: this.ohlc.close[index],
                        }));
                        
                        const atrArray = [];
                        let prevClose = null;
                        for (let i = 0; i < data.length; i++) {
                            if (i === 0) {
                                atrArray.push(null);
                            } else {
                                const tr = Math.max(data[i].high - data[i].low, Math.abs(data[i].high - prevClose), Math.abs(data[i].low - prevClose));
                                const atr = i < period ? tr : ((atrArray[i - 1] * (period - 1)) + tr) / period;
                                atrArray.push(atr);
                            }
                            prevClose = data[i].close;
                        }
                        return {atr:atrArray};
                    },
                    ROC: (obj) => {
                        let { data, priceType, period } = obj
                        period = typeNum(period)
                        priceType = !data ? typeStr(priceType) : priceType
                        data = data || this.ohlc[priceType];

                        if (data.length <= period){
                            return {roc: Array(data.length).fill(null)}
                        }

                        const rocArray = [];
                        for (let i = 0; i < data.length; i++) {
                            if (i < period) {
                                rocArray.push(null);
                            } else {
                                const roc = ((data[i] - data[i - period]) / data[i - period]) * 100;
                                rocArray.push(roc);
                            }
                        }
                        return {roc:rocArray};
                    },
                    Volume: (obj) => {
                        let { data, period } = obj;
                        period = typeNum(period);
                        data = data || this.ohlc.volume; 

                        if (data.length <= period){
                            return {
                                volume: Array(data.length).fill(null),
                                volumeAvg: Array(data.length).fill(null),
                            }
                        }
                
                        const volumeAvg = [];
                        for (let i = 0; i < data.length; i++) {
                            if (i < period - 1) {
                                volumeAvg.push(null);
                            } else {
                                const sma = data.slice(i - period + 1, i + 1).reduce((sum, volume) => sum + volume, 0) / period;
                                volumeAvg.push(sma);
                            }
                        }
                        return { 'volume': data, 'volumeAvg': volumeAvg };
                    },
                    VWAP: (obj) => {
                        let { high, low, close, volume, numStdDev } = obj;
                        numStdDev = typeNum(numStdDev) || 2;
                        high = this.ohlc.high;
                        low = this.ohlc.low;
                        close = this.ohlc.close;
                        volume = this.ohlc.volume;
            
                        const vwapArray = [];
                        const upperBandArray = [];
                        const lowerBandArray = [];
                        let cumulativeTPV = 0; 
                        let cumulativeVolume = 0;
                        let sumSquaredDiff = 0; 
                    
                        for (let i = 0; i < high.length; i++) {
                            const typicalPrice = (high[i] + low[i] + close[i]) / 3;
                            const pv = typicalPrice * volume[i];
                    
                            cumulativeTPV += pv;
                            cumulativeVolume += volume[i];
                    
                            const vwap = cumulativeTPV / cumulativeVolume;
                            vwapArray.push(vwap);
                    
                            // For standard deviation bands
                            if (i > 0) {
                                sumSquaredDiff += Math.pow(typicalPrice - vwap, 2);
                                const stDev = Math.sqrt(sumSquaredDiff / (i + 1));
                                const upperBand = vwap + (stDev * numStdDev);
                                const lowerBand = vwap - (stDev * numStdDev);
                    
                                upperBandArray.push(upperBand);
                                lowerBandArray.push(lowerBand);
                            } else {
                                upperBandArray.push(null);
                                lowerBandArray.push(null);
                            }
                        }
                    
                        return { 
                            vwap: vwapArray,
                            upperBand: upperBandArray,
                            lowerBand: lowerBandArray
                        };
                    },
                    Ichimoku: (obj) => {
                        let { ConversionLineLen, BaseLineLen, LeadingSpanLen } = obj;
                        let high = this.ohlc.high;
                        let low = this.ohlc.low;
                        let close = this.ohlc.close;
                        ConversionLineLen = typeNum(ConversionLineLen) || 9; 
                        BaseLineLen = typeNum(BaseLineLen) || 26; 
                        LeadingSpanLen = typeNum(LeadingSpanLen) || 52; 

                        if (close.length < Math.max(ConversionLineLen, BaseLineLen, LeadingSpanLen)) { 
                            return {
                                ConversionLine: Array(data.length).fill(null),
                                BaseLine: Array(data.length).fill(null),
                                LeadingSpanA: Array(data.length).fill(null),
                                LeadingSpanB: Array(data.length).fill(null),
                                LaggingSpan: Array(data.length).fill(null)
                            }
                        }

                    
                        const ConversionLine = []; // TenkanSen
                        const BaseLine = []; // KijunSen
                        const LeadingSpanA = []; // Senkou Span A
                        const LeadingSpanB = []; // Senkou Span B
                        const LaggingSpan = []; // Chikou Span
                    
                        for (let i = 0; i < high.length; i++) {
                            // Conversion Line (TenkanSen)
                            if (i >= ConversionLineLen - 1) {
                                const highSlice = high.slice(i - ConversionLineLen + 1, i + 1);
                                const lowSlice = low.slice(i - ConversionLineLen + 1, i + 1);
                                ConversionLine.push((Math.max(...highSlice) + Math.min(...lowSlice)) / 2);
                            } else {
                                ConversionLine.push(null);
                            }
                    
                            // Base Line (KijunSen)
                            if (i >= BaseLineLen - 1) {
                                const highSlice = high.slice(i - BaseLineLen + 1, i + 1);
                                const lowSlice = low.slice(i - BaseLineLen + 1, i + 1);
                                BaseLine.push((Math.max(...highSlice) + Math.min(...lowSlice)) / 2);
                            } else {
                                BaseLine.push(null);
                            }
                    
                            // Leading Span A & B
                            if (i >= LeadingSpanLen - 1) {
                                const highSliceB = high.slice(i - LeadingSpanLen + 1, i + 1);
                                const lowSliceB = low.slice(i - LeadingSpanLen + 1, i + 1);
                                LeadingSpanA.push((ConversionLine[i - BaseLineLen + 1] + BaseLine[i - BaseLineLen + 1]) / 2);
                                LeadingSpanB.push((Math.max(...highSliceB) + Math.min(...lowSliceB)) / 2);
                            } else {
                                LeadingSpanA.push(null);
                                LeadingSpanB.push(null);
                            }
                    
                            // Lagging Span (Chikou Span)
                            if (i >= BaseLineLen - 1) {
                                LaggingSpan.push(close[i - BaseLineLen + 1]);
                            } else {
                                LaggingSpan.push(null);
                            }
                        }
                    
                        return {
                            ConversionLine,
                            BaseLine,
                            LeadingSpanA,
                            LeadingSpanB,
                            LaggingSpan
                        };
                    }
                    
                };
            
                const defaultInputs={
                    'EMA':{ 'level':'upper', 'priceType':'close', 'period':20 },
                    'SMA':{ 'level':'upper', 'priceType':'close', 'period':10 },
                    'RSI':{ 'priceType':'close', 'period':14, 'overBought': 70, 'overSold': 30},
                    'ATR':{ 'priceType':'close', 'period':14 },
                    'ROC':{ 'priceType':'close', 'period':9 },
                    'VWAP':{ 'level':'upper','numStdDev':2},
                    'Volume':{ 'period':50, 'level':'lower'},
                    'StochasticOscillator':{ 'priceType':'close', 'period':14 },
                    'MACD':{ 'priceType':'close', 'shortPeriod':12, 'longPeriod' :26, 'signalPeriod': 9 },
                    'TwoMovAvg':{ 'level':'upper', 'priceType':'close', 'MovAvgType':'EMA', 'shortPeriod':12, 'longPeriod' :26},
                    'BollingerBands':{ 'level':'upper', 'priceType':'close','period':20, 'factor': 2 },
                    'Ichimoku':{ 'level':'upper', 'ConversionLineLen': 9, 'BaseLineLen': 26, 'LeadingSpanLen': 52 },
                }
            
                const defaultPlots = {
                    'MACD':{
                        'MACD':{'color':'#009957'},
                        'Signal':{'color':'#9166ff'},
                        'cloud':['MACD', 'Signal'],
                        'showCloud': true,
                    },
                    'TwoMovAvg':{
                        'cloud':['fastAvg', 'slowAvg'],
                        'fastAvg':{'color':'#0095ff'},
                        'slowAvg':{'color':'#ffe866'},
                        'showCloud': false,
                    },
                    'Volume':{
                        'volume':{
                            'plotType':'histogram',
                            'color':'#626262'
                        },
                        'volumeAvg':{'showPlot': false },
                        'shortName':'Volume',
                        'chartMargin': {'t': this.lowerChartMargin.t, 'b': 5},
                        'staticMinVal': 0
                    },
                    'RSI':{
                        'overBought':{'plotType':'dashed-line-long','color':'#999999'},
                        'overSold':{'plotType':'dashed-line-long','color':'#999999'},
                    },
                    'BollingerBands':{
                        'cloud': ['Upper','Lower'],
                    },
                    'VWAP':{
                        'cloud': ['upperBand','lowerBand'],
                    },
                    'Ichimoku':{
                        'ConversionLine': {showPlot: false}, 
                        'BaseLine': {showPlot: false}, 
                        'LeadingSpanA': {showPlot: true, 'color':'#a5d6a7'}, 
                        'LeadingSpanB': {showPlot: true, 'color': '#ef9a9a'}, 
                        'LaggingSpan': {showPlot: false}, 
                        'cloud': ['LeadingSpanA','LeadingSpanB'],
                        'showCloud': true,
                        'shortName':'Ichimoku'
                    },
                    'EMA':{
                        'ema': {
                            'plotType':'dashed-line-short',
                        }
                    },
                }
            
                const gVoF = this.U.getValueOrFallback

                const dic = {}
                for (let ind of Object.keys(formulas)){
                    dic[ind] = ()=>{
                        const newDic = {}
                        newDic.inputs = {...defaultInputs[ind]}
                        const dataResult = formulas[ind](newDic.inputs)
                        newDic.name = ind, 
                        newDic.shortName = gVoF(defaultPlots,`${ind}.shortName`, ind.replace(/[a-z _]/g, '')) 
                        newDic.inputs.level = gVoF(defaultInputs, `${ind}.level`, 'lower')
                        newDic.data = dataResult
                        newDic.minMax = {'min': null, 'max': null}
                        newDic.htmlEls = {}
                        newDic.infoBox = null
                        newDic.chartMargin = gVoF( defaultPlots,`${ind}.chartMargin` ,{'t': this.lowerChartMargin.t, 'b': this.lowerChartMargin.b})
                        newDic.staticMinVal = gVoF( defaultPlots,`${ind}.staticMinVal` , null)
                        newDic.plots = Object.keys(dataResult).reduce((acc, key) => {
                            acc[key] = { 
                                'showPlot': gVoF(defaultPlots,`${ind}.${key}.showPlot`, true), 
                                'plotType': gVoF(defaultPlots,`${ind}.${key}.plotType`,'line'),
                                'color': gVoF(defaultPlots,`${ind}.${key}.color`,this.color.getColor()),
                                'plotWidth': 1,
                            }
                            return acc;
                        }, {});
                        newDic.updateData = ()=>{
                            const dataResult = formulas[ind](newDic.inputs)
                            newDic.data = dataResult
                            const cloudValues = gVoF(defaultPlots,`${ind}.cloud`, false)
                            if(cloudValues){
                                let upperValues = newDic.data[newDic.cloudInputs.values[0]]
                                let lowerValues = newDic.data[newDic.cloudInputs.values[1]]
                                newDic.cloudCrossOvers = this.U.findCrossovers(upperValues,lowerValues, this.xPositions)
                            }
                        }
                        //if has cloud
                        const cloudValues = gVoF(defaultPlots,`${ind}.cloud`, false)
                        if(cloudValues){
                            newDic.cloudInputs = {'values':cloudValues}
                            newDic.cloudInputs.showCloud = gVoF(defaultPlots,`${ind}.showCloud`, false)
                            newDic.cloudInputs.colors = defaultPlots[ind].cloud.map(k=>defaultPlots[ind][k].color)
                            newDic.cloudInputs.alphaColors = [this.U.addAlpha(newDic.cloudInputs.colors[0]), this.U.addAlpha(newDic.cloudInputs.colors[1])]
                            let upperValues = newDic.data[newDic.cloudInputs.values[0]]
                            let lowerValues = newDic.data[newDic.cloudInputs.values[1]]
                            newDic.cloudCrossOvers = this.U.findCrossovers(upperValues,lowerValues, this.xPositions)
                        }
            
                        return newDic;
                    }
                }
                return dic
            },
            'generateRoundedPriceLevels':(start, end, step = 4)=> {
                if (start >= end) return []; 
                let range = end - start;
                let stepSize = Math.pow(10, Math.floor(Math.log10(range / step)));
                while (true) {
                    const numberOfSteps = Math.ceil(range / stepSize);
                    if (numberOfSteps > step) {
                        stepSize *= 2;
                    } else if (numberOfSteps < 2) {
                        stepSize /= 2;
                    } else { break; }
                }
                let levels = [];
                let initialLevel = Math.ceil(start / stepSize) * stepSize;
                let currentLevel = initialLevel - stepSize;
                while (currentLevel <= end + stepSize) {
                    levels.push(currentLevel);
                    currentLevel += stepSize;
                }
                return levels;
            },
            // 'Obj': class Obj {
            //     //Obj
            //     constructor() {
            //         this.list = {};
            //         this.dic = {};
            //         this.clouds = {};
            //     }
            
            //     updatePlots() {
            //         this.dic = {};
            //         this.clouds = {};
            //         for (let ind of Object.values(this.list)) {
            //             for (let [key, val] of Object.entries(ind.data)) {
            //                 this.dic[`${ind.nameId}_plot_${key}`] = {
            //                     'color': ind.plots[key].color,
            //                     'group': ind.nameId,
            //                     'type': ind.plots[key].plotType,
            //                     'plotWidth': ind.plots[key].plotWidth,
            //                     'level': ind.inputs.level,
            //                     'data': val,
            //                     'show': ind.plots[key].showPlot,
            //                     'ctx': ind.ctx
            //                 };
            //             }
            //             if (ind.cloudInputs) {
            //                 this.clouds[`${ind.nameId}_plot_cloud`] = {
            //                     'group': ind.nameId,
            //                     'type': 'cloud',
            //                     'plotWidth': 1,
            //                     'level': ind.inputs.level,
            //                     'cloudValues': ind.cloudInputs.values,
            //                     'show': ind.cloudInputs.showCloud,
            //                     'ctx': ind.ctx
            //                 };
            //             }
            //         }
            //         this.updateOutputs()
            //     }
            
            //     updateOutputs(){            
            //         this.plots = Object.values(this.dic)
            //         this.cloudPlots = Object.values(this.clouds)
            //         this.regularPlots = Object.values(this.dic).filter(v => !['dashed-line', 'cloud'].some(type => v.type === type || v.type.startsWith(type)));
            //         this.dashedLinePlots = Object.values(this.dic).filter(v => ['dashed-line'].some(type => v.type === type || v.type.startsWith(type)));
            //         this.upperIndicators = Object.values(this.list).filter(v => v.inputs.level == 'upper');
            //         this.lowerIndicators = Object.values(this.list).filter(v => v.inputs.level == 'lower');
            //     }
            
            //     getPlotType(arr) {
            //         return arr.flatMap(str => {
            //             typeStr(str); 
            //             return Object.values(this.dic).filter(v => {
            //                 if (str[0] === '!') {
            //                     const typeToExclude = str.slice(1);
            //                     return !v.type.includes(typeToExclude);
            //                 }
            //                 return v.type.includes(str);
            //             });
            //         });
            //     }
            
            //     getIndicatorType(criteria) {
            //         const result = [];
            //         for (const obj of Object.values(this.list)) {

            //             if (obj.inputs.level && criteria.includes(obj.inputs.level)) {
            //                 result.push(obj);
            //             }
            //         }
            //         return result;
            //     }
            // },
            'getValueOrFallback':(obj, path, fallback) =>{
                const keys = path.split('.');
                let current = obj;
                for (const key of keys) {
                    if (key in current) {
                        current = current[key];
                    } else { return fallback; }
                }
                return current;
            },
            'typeNum': typeNum,

            'typeStr': typeStr,

            'r':(e)=>{ return e.getBoundingClientRect() },

            'Mf':(n)=>{ return Math.floor(n) },
            
            'capitalize':(str)=>{
                return str[0].toUpperCase()+str.slice(1)
            },
            'formatAbbreviatedDate':(timestamp, format = "hour,minute") =>{
                // options "year,month,day,hour,minute"
                const date = new Date(parseFloat(timestamp));
                const options = {};
                options.hour12 = false;
                options.hour = '2-digit'
                options.minute = '2-digit'
            
                format.split(',').forEach(part => {
                    switch (part.trim().toLowerCase()) {
                        case 'year':
                            options.year = '2-digit';
                            break;
                        case 'month':
                            options.month = 'short';
                            break;
                        case 'day':
                            options.day = 'numeric';
                            break;
                        case 'hour':
                            options.hour = '2-digit';
                            break;
                        case 'minute':
                            options.minute = '2-digit';
                            break;
                    }
                });
            
                let data = date.toLocaleString('en-US', options);
                data = data.replace("24:00", "00:00");
                return data
            },
            'splitBeforeUppercaseAndJoin':(str) =>{
                return str.split(/(?<=[a-z])(?=[A-Z])/).join(' ');
            },
            'setSelectedOption':(optionsArray, selectedValue) =>{
                return optionsArray.map(option => {
                    if (option.includes(`value="${selectedValue}"`)) {
                        return option.replace('>', ' selected="selected">');
                    }
                    return option;
                }).join('\n'); 
            },
            'findCrossoverPoint':(line1, line2) =>{
                // Extract coordinates from the line objects
                let { x1, y1, x2, y2 } = line1;
                let { x3, y3, x4, y4 } = line2;
            
                // Calculate the differences
                let dx1 = x2 - x1;
                let dy1 = y2 - y1;
                let dx2 = x4 - x3;
                let dy2 = y4 - y3;
            
                // Calculate the slopes
                let m1 = dy1 / dx1;
                let m2 = dy2 / dx2;
            
                // Check if the lines are parallel or no crossover
                if (m1 === m2) { return null; }
            
                // Calculate the crossover point using linear equations
                let xCrossover = (m1 * x1 - m2 * x3 + y3 - y1) / (m1 - m2);
                let yCrossover = m1 * (xCrossover - x1) + y1;
                xCrossover = this.U.calculatePlacementPercentage(x1, xCrossover, x2)
                return { x: xCrossover, y: yCrossover };
            },
            'findCrossovers': (upperValues, lowerValues, xPositions)=>{
                let previousComparison = null;
                let dic = {}
                for (let i = 1; i < upperValues.length; i++) {
                    let currentComparison = upperValues[i] > lowerValues[i];
                    if (previousComparison !== null && currentComparison !== previousComparison) {
            
                        const line1 = {x1: xPositions[i -1].x, y1: upperValues[i-1], x2: xPositions[i].x, y2: upperValues[i] }
                        const line2 = {x3: xPositions[i -1].x, y3: lowerValues[i-1], x4: xPositions[i].x, y4: lowerValues[i] }
            
                        dic[i] = {
                            'line1': line1,
                            'line2': line2,
                            'value': this.U.findCrossoverPoint(line1, line2)
                        }
                    }
                    previousComparison = currentComparison;
                }
                return dic
            },
            'calculatePlacementPercentage':(value1, value2, value3) =>{
                let totalRange = value3 - value1;
                let positionInRange = value2 - value1;
            
                // To avoid division by zero, check if totalRange is not zero
                if (totalRange === 0) {
                    console.error("Invalid range: value1 and value3 are the same.");
                    return null;
                }
            
                let percentage = (positionInRange / totalRange);
                return percentage;
            },
            'drawCandle': (c)=>{
                this.ctx.fillStyle = this.candles[c.i].color;
                this.ctx.fillRect(
                    c.x - this.d.candleWidth/2, 
                    this.candles[c.i].y, 
                    this.d.candleWidth, 
                    Math.max(this.candles[c.i].height, 1),
                );
                // drawing candle wicks
                this.ctx.fillRect(
                    c.x - (this.wicks[c.i].width)/2, 
                    this.wicks[c.i].y, 
                    this.wicks[c.i].width ,
                    this.wicks[c.i].height,
                );
            },
            'drawClouds':()=>{
                if(!this.indicators?.cloudPlots){return}
                for(let val of this.indicators.cloudPlots){
                    this.U.drawPlots({ i:0, plot:val })
                }
            },
            'drawDashedLinePlots':()=>{
                if(!this.indicators.dashedLinePlots){return}
                for(let val of this.indicators.dashedLinePlots){
                    this.U.drawPlots({ i:0, plot:val })
                }
            },
            'drawCrossHairLine':(canvas, startX, startY, endX, endY) =>{
                const ctx = this[canvas.id].ctx
                ctx.save();
                ctx.setLineDash([8, 8]);
                ctx.lineWidth = 1;
                ctx.strokeStyle = this.color.crossHairColor;
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                ctx.stroke();
                ctx.restore();
            },
            // 'drawIndicators':(i)=>{
            //     if(!this.indicators.regularPlots?.length){
            //          return 
            //         }
            //     for(let val of this.indicators.regularPlots){
            //         this.U.drawPlots({ i:i, plot:val })
            //     }
            // },
            // 'drawLowerIndicatorYAxis':(group)=>{
            //     const chartCanvas = this[`canvas_${group}`];
            //     const yAxisCanvas = this[`canvas_${group}_yAxis`];
            //     const chartCtx = chartCanvas.ctx;
            //     const yAxisCtx = yAxisCanvas.ctx;
            //     const levels = this.U.generateRoundedPriceLevels(chartCanvas.min, chartCanvas.max)
            //     this.indicators.list[group]['yIntervals'] = levels
            //     let chartMargin = this.indicators.list[group].chartMargin
        
            //     chartCtx.fillStyle = this.color.line;
            //     yAxisCtx.font = `${this.font.size}px ${this.font.family}`;
            //     yAxisCtx.fillStyle = 'white';
            //     yAxisCtx.textBaseline = 'middle';
        
            //     levels.forEach(price =>{
            //         let y = this.U.placeValue(price, this.lower_chart_height, chartCanvas.min, chartCanvas.max, chartMargin);
            //         chartCtx.fillRect(0, y, chartCanvas.getWidth(), 1);
            //         let value = this.U.formatNumber(this.U.formatPrice(price))
            //         yAxisCtx.fillText(value, 5, y);
            //     })
            // },
            'drawPlots':(obj)=>{
                const { plot, i } = obj;
                const ctx = plot.ctx
                const c = this.inFrameCandles[i]
                const nextC = this.inFrameCandles[i+1]
        
                const drawingMethods = {
                    'candle': ()=>{
                        i == 0 && this.U.drawCandle(c)
                        nextC && this.U.drawCandle(nextC)
                    },
                    'dash': ()=>{
                        ctx.lineWidth = plot.plotWidth
                        ctx.fillStyle = plot.color
                        ctx.beginPath();
                        ctx.moveTo(c.x, y)
                        ctx.fillRect(
                            c.x - (this.d.candleWidth/2),
                            y,
                            this.d.candleWidth, // width
                            plot.plotWidth // height 
                        )
                    },
                    'histogram': ()=>{
                        ctx.lineWidth = plot.plotWidth
                        ctx.fillStyle = plot.color
                        ctx.beginPath();
                        const zeroY = this.U.placeValue(0, height, min, max, chartMargin);
                        let barHeight = Math.abs(zeroY - y) +1;
                        if (i == 0) {
                            ctx.moveTo(c.x, y);
                            ctx.fillRect(
                                c.x - (this.d.candleWidth / 2),
                                y,
                                this.d.candleWidth, // width
                                barHeight // height 
                            );
                        }
                        let nextBarHeight = Math.abs(zeroY - nextY) +1;
                        ctx.moveTo(nextX, nextY);
                        ctx.fillRect(
                            nextX - (this.d.candleWidth / 2),
                            nextY,
                            this.d.candleWidth, // width
                            nextBarHeight // height 
                        );
                    },
                    'square': ()=>{
                        let val = plot.plotWidth * 4
                        ctx.lineWidth = plot.plotWidth
                        ctx.fillStyle = plot.color
                        ctx.beginPath();
                        ctx.fillRect(
                            c.x - (val/2), 
                            y - (val/2), 
                            val, // width
                            val // height
                        );
                        ctx.fill()
                    },
                    'up-triangle': ()=>{
                        let val = plot.plotWidth * 4
                        ctx.lineWidth = plot.plotWidth
                        ctx.fillStyle = plot.color
                        ctx.beginPath();
                        ctx.moveTo(c.x, y)
                        ctx.lineTo(c.x +val, y + val);
                        ctx.lineTo(c.x -val, y + val);
                        ctx.lineTo(c.x, y);
                        ctx.fill()
                    },
                    'down-triangle': ()=>{
                        let val = plot.plotWidth * 4
                        ctx.lineWidth = plot.plotWidth
                        ctx.fillStyle = plot.color
                        ctx.beginPath();
                        ctx.moveTo(c.x, y)
                        ctx.lineTo(c.x -val, y - val);
                        ctx.lineTo(c.x +val, y - val);
                        ctx.lineTo(c.x, y);
                        ctx.fill()
                    },
                    'up-arrow': ()=>{
                        let val = plot.plotWidth * 4
                        ctx.lineWidth = plot.plotWidth
                        ctx.fillStyle = plot.color
                        ctx.beginPath();
                        ctx.moveTo(c.x, y)
                        ctx.lineTo(c.x +val, y + val);
                        ctx.lineTo(c.x +(val/3), y + val);
                        ctx.lineTo(c.x +(val/3), y + (val*2));
                        ctx.lineTo(c.x -(val/3), y + (val*2));
                        ctx.lineTo(c.x -(val/3), y + val );
                        ctx.lineTo(c.x -val, y + val );
                        ctx.lineTo(c.x, y);
                        ctx.fill()
                    },
                    'down-arrow': ()=>{
                        let val = plot.plotWidth * 5
                        ctx.lineWidth = plot.plotWidth
                        ctx.fillStyle = plot.color
                        ctx.beginPath();
                        ctx.moveTo(c.x, y)
                        ctx.lineTo(c.x -val, y - val);
                        ctx.lineTo(c.x -(val/3), y - val);
                        ctx.lineTo(c.x -(val/3), y - (val*2));
                        ctx.lineTo(c.x +(val/3), y - (val*2));
                        ctx.lineTo(c.x +(val/3), y - val );
                        ctx.lineTo(c.x +val, y - val );
                        ctx.lineTo(c.x, y);
                        ctx.fill()
                    },
                    'line': (patt = [])=>{
                        ctx.lineWidth = plot.plotWidth
                        ctx.strokeStyle = plot.color
                        ctx.setLineDash(patt)
                        ctx.beginPath();
                        if(i===0 && plot.data[c.i -1]){ 
                            ctx.moveTo(preX, preY) 
                        }
                        if(plot.level == 'upper'){
                            if(plot.data[c.i] == null || plot.data[c.i] == 0){
                                ctx.moveTo(nextX, nextY)
                            }else{
                                ctx.lineTo(c.x, y)
                            }
                        }else{
                            ctx.lineTo(c.x, y)
                        }
                        ctx.lineTo(nextX, nextY)
                        ctx.stroke()
                    },
                    'dashed-line-short': ()=>{ 
                        drawingMethods['dashed-line']([6,6]) 
                        if(i>0){return}
                    },
                    'dashed-line-long': ()=>{ 
                        drawingMethods['dashed-line']([15,15]) 
                        if(i>0){return}
                    },
                    'dashed-line': (patt = [15, 15])=>{
                        if(i>0){return}
                        ctx.lineWidth = plot.plotWidth;
                        ctx.strokeStyle = plot.color;
                        ctx.setLineDash(patt);
                        ctx.beginPath();
                        this.inFrameCandles.forEach((v, idx1) => {
                            let y = this.U.placeValue(plot.data[v.i], height, min, max, chartMargin);
                            let nextX = v.x + this.d.xGap;
                            let nextY = this.U.placeValue(plot.data[v.i + 1], height, min, max, chartMargin);
                            if (idx1 === 0) {
                                let preX = v.x - this.d.xGap;
                                let preY = this.U.placeValue(plot.data[v.i - 1], height, min, max, chartMargin);
                                if (plot.data[v.i - 1]) { ctx.moveTo(preX, preY); }
                            }
                            if (plot.level === 'upper' && (plot.data[v.i] == null || plot.data[v.i] === 0)) {
                                ctx.moveTo(nextX, nextY);
                            } else {
                                ctx.lineTo(v.x, y);
                            }
                        });
                        
                        ctx.stroke();
                    },
                    'point': ()=>{
                        let radious = Math.min(plot.plotWidth, 4)+1.5
                        ctx.beginPath();
                        ctx.lineWidth = plot.plotWidth
                        ctx.fillStyle = plot.color
                        ctx.moveTo(c.x, y);
                        ctx.arc(c.x, y, radious, 0, 2 * Math.PI);
                        ctx.fill();
                    },
                    'cloud': () => {
                        const colors = this.indicators.list[plot.group].cloudInputs.alphaColors
                        let upperValues = this.indicators.list[plot.group].data[plot.cloudValues[0]];
                        let lowerValues = this.indicators.list[plot.group].data[plot.cloudValues[1]];
        
                        let startIdx = -1; // Start index modified to -1
                        let currentCondition = null; // true if upper above lower, false if lower above upper, null otherwise
                        const crossOvers = this.indicators.list[plot.group].cloudCrossOvers;
                        
                    
                        const drawSegment = (endIdx) => {
                            ctx.beginPath();
                        
                            // Check for crossover before starting the top line
                            let firstPoint = this.U.handleIdx( startIdx, this.inFrameCandles);
                            let firstX = firstPoint.x;
                            let firstY = this.U.placeValue(upperValues[firstPoint.i], height, min, max, chartMargin);
                            if (crossOvers[firstPoint.i]) {
                                firstY = this.U.placeValue(crossOvers[firstPoint.i].value.y, height, min, max, chartMargin);
                                firstX -= (1 - crossOvers[firstPoint.i].value.x) * this.d.xGap;
                                ctx.moveTo(firstX, firstY);
                            }
                        
                            // Initial move to the first valid point (if not already done by crossover check)
                            let initialMoveDone = crossOvers[firstPoint.i] ? true : false;
                            for (let i = startIdx; i <= endIdx && !initialMoveDone; i++) {
                                let v = this.U.handleIdx(i, this.inFrameCandles)
                                if (upperValues[v.i] !== null && lowerValues[v.i] !== null) {
                                    let y = this.U.placeValue(upperValues[v.i], height, min, max, chartMargin);
                                    ctx.moveTo(v.x, y);
                                    initialMoveDone = true;
                                }
                            }
                        
                            // Continue drawing the top line of the cloud
                            for (let i = startIdx; i <= endIdx; i++) {
                                let v = this.U.handleIdx(i, this.inFrameCandles)
                                if (upperValues[v.i] !== null && lowerValues[v.i] !== null) {
                                    let y = this.U.placeValue(upperValues[v.i], height, min, max, chartMargin);
                                    ctx.lineTo(v.x, y);
                                } else {
                                    // Skip to the next valid coordinates without drawing
                                    i++;
                                    if (i <= endIdx) {
                                        v = this.inFrameCandles[i];
                                        if (upperValues[v.i] !== null && lowerValues[v.i] !== null) {
                                            let nextY = this.U.placeValue(upperValues[v.i], height, min, max, chartMargin);
                                            ctx.moveTo(v.x, nextY);
                                        }
                                    }
                                }
                            }
                        
                            // Check for crossover before starting the bottom line in reverse
                            let lastPoint = this.inFrameCandles[endIdx];
                            let lastX = lastPoint.x;
                            let lastY = this.U.placeValue(lowerValues[lastPoint.i], height, min, max, chartMargin);
                            if (crossOvers[lastPoint.i + 1]) {
                                lastY = this.U.placeValue(crossOvers[lastPoint.i + 1].value.y, height, min, max, chartMargin);
                                lastX += crossOvers[lastPoint.i + 1].value.x * this.d.xGap;
                                ctx.lineTo(lastX, lastY);
                            }
                        
                            // Continue drawing the bottom line of the cloud in reverse
                            for (let i = endIdx; i >= startIdx; i--) {
                                let v = this.U.handleIdx( i, this.inFrameCandles)
                                if (lowerValues[v.i] !== null && upperValues[v.i] !== null) {
                                    let y = this.U.placeValue(lowerValues[v.i], height, min, max, chartMargin);
                                    ctx.lineTo(v.x, y);
                                }
                            }
                            ctx.closePath();
                            ctx.fillStyle = currentCondition ? colors[0] : colors[1];
                            ctx.fill();
                        };
        
                        this.inFrameCandles.forEach((v, idx) => {
                            let condition = upperValues[v.i] > lowerValues[v.i];
                            if (currentCondition === null) {
                                currentCondition = condition;
                            }
                    
                            if (condition !== currentCondition || idx === this.inFrameCandles.length - 1) {
                                drawSegment(idx - (condition !== currentCondition ? 1 : 0));
                                startIdx = idx;
                                currentCondition = condition;
                            }
                        });
                    },
                }
        
                // Check for candleType
                if (plot.candleType === 'candle') {
                    drawingMethods['candle']();
                    return;
                }
        
                if (!plot.show) return;
        
                let height = plot.height, min = this.newMin, max = this.newMax;
                let chartMargin = this.margin
        
                if (plot.level === 'lower') {
                    height = this.lower_chart_height;
                    min = this[`canvas_${plot.group}`].min;
                    max = this[`canvas_${plot.group}`].max;
                    chartMargin = this.indicators.list[plot.group].chartMargin
        
                    if (!min && !max) {
                        min = -.5;
                        max = .5;
                    }
                } 
                
                let y, nextX, nextY, preX, preY;
        
                if(plot.type != 'cloud' && plot.data[c.i]){
                    y = this.U.placeValue(plot.data[c.i] , height, min, max, chartMargin);
                    nextX = c.x + this.d.xGap;
                    nextY = this.U.placeValue(plot.data[c.i +1] , height, min, max, chartMargin);
                    preX = c.x - this.d.xGap;
                    preY = this.U.placeValue(plot.data[c.i - 1] , height, min, max, chartMargin);
                    plot.type.split(' ').forEach(type => {
                        drawingMethods[type]();
                    });
                }else{
                    plot.type.split(' ').forEach(type => {
                        drawingMethods[type]();
                    });
                }
                ctx.strokeStyle = false; // reset ctx
            },
            'draw_X_axis':()=>{
                const ctx = this.U.s('#canvas_xAxis').getContext('2d');
                ctx.clearRect(0,0,  this.canvas_xAxis.getWidth(), this.canvas_xAxis.height )
                ctx.font = `${this.font.size}px ${this.font.family}`;
                ctx.fillStyle = 'white'
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                
                this.xInterval.forEach( v => {
                    const dateTIme = this.U.formatAbbreviatedDate(this.ohlc.date[v.i], "hour,minute")
                    ctx.fillText( dateTIme, v.x, (this.canvas_xAxis.height/2) ); 
                })
            },
            'draw_Y_axis':()=>{
                const ctx = this.U.s('#canvas_main_yAxis').getContext('2d')
                ctx.clearRect(0,0,  this.canvas_main_yAxis.width, this.chart_height )
                this.yInterval.forEach( v =>{
                    ctx.font = `${this.font.size}px ${this.font.family}`;
                    ctx.fillStyle = 'white'
                    ctx.textBaseline = "middle";
                    let fotmattedPrice = this.U.formatNumber(v.price)
                    ctx.fillText( fotmattedPrice, 5, v.y );
                })
            },
            'handleIdx':(idx, candles)=>{
                let n = candles[0];
                if (idx < 0){return { ...n, x: n.x + (this.d.xGap * idx), i: n.i +idx };}
                return candles[idx];
            },
            'formatPrice':(price) =>{
                let str = Math.floor(price)+""
                if (typeof price === 'number' && str.length < 4) { 
                    return price.toFixed(2); 
                }
                return price
            },
            'isLessThan24Hours':(date1, date2) =>{
                const oneDay = 24 * 60 * 60 * 1000; 
                return Math.abs(date2 - date1) < oneDay;
            },
            'findPeriods':(timestamps, start=930, end=1600) =>{
                const periods = {};
                let currentPeriodStart = null;
            
                timestamps.forEach((timestamp, index) => {
                    const date = new Date(timestamp);
                    const hour = date.getHours();
                    const minutes = date.getMinutes();
                    const time = hour * 100 + minutes; // Convert current time to HHMM format
            
                    // Check if the time falls within trading hours
                    let isTradingTime;
                    if (start > end) {
                        // Trading period spans midnight
                        isTradingTime = time < start && time >= end;
                    } else {
                        // Trading period does not span midnight
                        isTradingTime = time >= start && time < end;
                    }
            
                    if (isTradingTime) {
                        // Mark the start of a trading period
                        if (currentPeriodStart === null) {
                            currentPeriodStart = index;
                        }
                    } else {
                        // Close the current trading period
                        if (currentPeriodStart !== null) {
                            let key = `${currentPeriodStart}_${index}`;
                            periods[key] = { startIndex: currentPeriodStart, endIndex: index - 1 };
                            currentPeriodStart = null;
                        }
                    }
                });
            
                // Handle case where the last interval is still within trading hours
                if (currentPeriodStart !== null) {
                    let key = `${currentPeriodStart}_${timestamps.length}`;
                    periods[key] = { startIndex: currentPeriodStart, endIndex: timestamps.length - 1 };
                }
                return periods;
            },
            'identifyMarketZones':()=>{
                this.nonTradingPeriods = []
                const dates =  this.ohlc.date
                if(!this.U.isLessThan24Hours(dates[0], dates[1])){ return }
                this.nonTradingPeriods = this.U.findPeriods(dates)
            },
            'getDataInRange':(obj, rangeStart, rangeEnd) =>{
                return Object.keys(obj)
                    .filter(key => {
                        const [start, end] = key.split('_').map(Number);
                        // Check if any part of the key is within the range or if the range is within the key
                        return (start <= rangeEnd && end > rangeStart);
                    })
                    .map(key => obj[key]);
            },
            'drawClosedMarketBackground':() =>{
                const { inFrameCandles, nonTradingPeriods } = this;
                const data = this.U.getDataInRange(nonTradingPeriods, inFrameCandles[0].i, inFrameCandles.at(-1).i);
                const rgbNumber = 5;
                const chartHeight = this['canvas_background'].height;
                const halfXGap = this.d.xGap / 2;
                const shade = (x, y, w, h) => {
                    const chart = this.U.s('#canvas_background')
                    const ctx = chart.getContext('2d');
                    ctx.fillStyle = `rgba(${rgbNumber},${rgbNumber},${rgbNumber},0.3)`;
                    ctx.fillRect(x, y, w, h);
                };
            
                data.forEach(d => {
                    const startDiff = d.startIndex - inFrameCandles[0].i;
                    const endDiff = Math.max(d.endIndex - inFrameCandles[0].i, 0);
                    const startIndex = Math.max(startDiff, 0);
                    const endIndex = Math.min(endDiff, inFrameCandles.length - 1);
                    const c1 = this.U.handleIdx( startIndex, inFrameCandles);
                    const c2 = inFrameCandles[endIndex];
                    const width = c2.x - c1.x + this.d.xGap;
                    const height = chartHeight;
                    shade(c1.x - halfXGap, 0, width, height);
                });
            },
            'findIndexInframe':(array, number) =>{
                let lastIndex = -1;
                for (let i = 0; i < array.length; i++) {
                    if (array[i].x < number) {
                        lastIndex = i;
                    }
                }
                return lastIndex;
            },
            'getMiddlePointOfTouches':(event) =>{
                if (event.touches.length == 2) {
                    let middleX = (event.touches[0].pageX + event.touches[1].pageX) / 2;
                    let middleY = (event.touches[0].pageY + event.touches[1].pageY) / 2;
                    return { 
                        x: middleX, 
                        y: middleY, 
                        diff: event.touches[0].pageX - event.touches[1].pageX
                    };
                }
                return null;
            },
            'clearLongPressTimer':()=>{
                this.d.longPress = false
                clearTimeout(this.longPressTimer)
            },
            'addAlpha':(color, opacity = .15) =>{
                let r = parseInt(color.substring(1, 3), 16);
                let g = parseInt(color.substring(3, 5), 16);
                let b = parseInt(color.substring(5, 7), 16);
                let a = Math.round(opacity * 255);
                let hexAlpha = a.toString(16).padStart(2, '0');
                let hexColor = r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');
                return '#'+hexColor + hexAlpha;
            },
            'resizeChart':()=>{
                this.static.windowWidth = window.innerWidth
                const els = this.U.s('.wresize')
                const allCanvas = this.U.s('.resize')
                const width = this.U.r(this.container).width - this.canvas_main_yAxis.getWidth()-10
                els.forEach(el=> el.style.width = `${(width)}px`)
                allCanvas.forEach(c=> c.setAttribute('width', `${(width)}px`))
                this.chart_width = width
                this.d['tOriginX'] = this.inFrameCandles.at(-1)
                this.U.setDimentions()
                this.U.showRecentCandle()
                this.U.draw()
            },
            'sizeObserver':()=>{
                const resizeObserver = new ResizeObserver(entries => {
                    for (let entry of entries) {
                        this['canvas_background'].height = this.U.r(this.U.s('#frame')).height
                        this.U.resizeChart()
                    }
                });
                
                resizeObserver.observe(this.U.s('#frame'));
            },
            'drawInfoBox':(ctx, text, x, y, centered = false) =>{
                const padding = 3;
                const borderRadius = 4;
                const fontSize = 14; // Assuming a fixed font size
            
                ctx.save(); // Save current canvas state
            
                ctx.font = `${fontSize}px Arial`;
                const textMetrics = ctx.measureText(text);
                const textWidth = textMetrics.width;
                const rectWidth = textWidth + padding * 2;
                const rectHeight = fontSize + padding * 2;
            
                // Adjust rectX and rectY for proper centering
                const rectX = centered ? x - rectWidth / 2 : x
                const rectY = (y - rectHeight / 2)
            
                // Draw rounded rectangle
                ctx.beginPath();
                ctx.moveTo(rectX + borderRadius, rectY);
                ctx.lineTo(rectX + rectWidth - borderRadius, rectY);
                ctx.arcTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + borderRadius, borderRadius);
                ctx.lineTo(rectX + rectWidth, rectY + rectHeight - borderRadius);
                ctx.arcTo(rectX + rectWidth, rectY + rectHeight, rectX + rectWidth - borderRadius, rectY + rectHeight, borderRadius);
                ctx.lineTo(rectX + borderRadius, rectY + rectHeight);
                ctx.arcTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - borderRadius, borderRadius);
                ctx.lineTo(rectX, rectY + borderRadius);
                ctx.arcTo(rectX, rectY, rectX + borderRadius, rectY, borderRadius);
                ctx.closePath();
                ctx.fillStyle = 'white';
                ctx.fill();
            
                // Draw text
                ctx.fillStyle = 'black';
                ctx.textBaseline = 'middle';
                ctx.textAlign = 'center';
            
                // Adjust text position
                ctx.fillText(text, rectX + rectWidth / 2, y);
            
                ctx.restore(); // Restore canvas state
            },
            'draw_x_axis_info':() =>{
                const d = this.d;
                if (d.event.type != 'mousemove' || d.candleIdx < 0 || !d.longPress || !d.event.target.classList.contains('chart')) {
                    return;
                }
                let x = d.crossHairOffsetX;
                let y = 20
                const text = this.U.formatAbbreviatedDate(this.ohlc.date[d.candleIdx], "year,month,day,hour,minute");
                const ctx = this.U.s('#canvas_xAxis').getContext('2d');
            
                this.U.drawInfoBox(ctx, text, x, y, true);
            },
            'draw_y_axis_info':() =>{
                const d = this.d;
                if ( d.event.type != 'mousemove' || !d.longPress ) { return; }
                const ctx = this[`${d.crossHairTarget.id}_yAxis`]?.ctx;
                if(!ctx){return}
                let x = 2
                let y = d.crossHairOffsetY;
                let group = this.U.removeFromString(d.crossHairTarget.id,['canvas_','_yAxis','xAxis'])
                const ind = this.indicators?.list[group]
                let chartMargin = ind ? ind.chartMargin : this.margin
                const data = this[d.crossHairTarget.id]
                let text = this.U.valueFromPx(y, data.height, data.min, data.max, chartMargin)
                text = this.U.formatNumber(+text)
                this.U.drawInfoBox(ctx, text, x, y);
            },
            'valueFromPx':(px, chart_height = this.chart_height, min = this.newMin, max = this.newMax, margin = {'t': this.margin.t, 'b':this.margin.b}) =>{
                if (px == null) { return px; }
                let effectiveHeight = chart_height - margin.t - margin.b; // Adjust chart height for margins
                let adjustedPx = chart_height - margin.b - px; // Adjust pixel value considering bottom margin
                let normalizedPx = adjustedPx / effectiveHeight; // Normalize pixel value to range 0-1
                let value = normalizedPx * (max - min) + min; // Map normalized pixel value back to price range
                return value;
            },
            'formatNumber':(number) =>{
                number = typeof number == 'string' ? +number : number
                let suffix = '';
                let divisor = 1;
                let rounder = 1
                if (Math.abs(number) >= 1e9) {
                    suffix = ' B';
                    divisor = 1e9;
                } else if (Math.abs(number) >= 1e6) {
                    suffix = ' M';
                    divisor = 1e6;
                    rounder = 2
                } else if (Math.abs(number) >= 1e3) {
                    suffix = ' K';
                    divisor = 1e3;
                }
                const formattedNumber = (number / divisor).toFixed(rounder) + suffix
                return Math.abs(number) >= 1e3 ? formattedNumber : number.toFixed(2);
            },
            'getCurrentDate':() =>{
                const date = new Date(); 
                const year = date.getFullYear(); 
                const month = (date.getMonth() + 1).toString().padStart(2, '0'); 
                const day = date.getDate().toString().padStart(2, '0'); 
                return `${year}-${month}-${day}`; 
            },
            'getStockData': async (symbol = "SPY") =>{
                const apiKey = '0ixKTO1fEw9YS3sfQ_TQ0PxFGNHD6a0g';
                const limit = 50000;
                const adjusted = false;
                const interval = 'hour'
                const range = 1
                const dates = ['2023-01-01', this.U.getCurrentDate()];
                const apiUrl = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/${range}/${interval}/${dates[0]}/${dates[1]}?adjusted=${adjusted}&sort=asc&limit=${limit}&apiKey=${apiKey}`;
            
                try {
                    const response = await fetch(apiUrl);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const res = await response.json();
                    return res
                } catch (error) {
                    console.error('Error fetching stock data:', error);
                }
            },
            'updateCandleData':(res) =>{
                if(!res){
                    console.log('no response')
                    return
                }
                const data = this.U.transformArrayToDict(res.results)
                const newKeys = ['o,open', 'h,high', 'l,low', 'c,close', 'v,volume', 't,date']
                newKeys.forEach(v => {
                    v = v.split(',')
                    this.U.renameKey(data, v[0], v[1])
                })
                
                this.U.fadeInOutCharts({func:()=>{
                    this.ohlc = data
                    this.U.setCandles()
                    // this.U.updateAllIndicators()
                    this.U.s('#mesageDiv').style.display = 'none'
                }})
            },
            'transformArrayToDict':(array) =>{
                let dict = {};
            
                array.forEach(item => {
                    Object.keys(item).forEach(key => {
                        if (!dict[key]) {
                            dict[key] = [];
                        }
                        dict[key].push(item[key]);
                    });
                });
            
                return dict;
            },
            'renameKey':(obj, oldKey, newKey) =>{
                if (oldKey in obj) {
                    obj[newKey] = obj[oldKey];
                    delete obj[oldKey];
                }
            },
            'colorDifference':(color1, color2) =>{
                // Simple RGB difference calculation
                const rgb1 = color1.match(/\w\w/g).map(hex => parseInt(hex, 16));
                const rgb2 = color2.match(/\w\w/g).map(hex => parseInt(hex, 16));
                return Math.abs(rgb1[0] - rgb2[0]) + Math.abs(rgb1[1] - rgb2[1]) + Math.abs(rgb1[2] - rgb2[2]);
            },
            'searchSymbol': async (str)=>{
                this.U.s('#stock-input').value = str
                this.U.s('#mesageDiv').style.display = 'flex'
                this.U.s('#mesageDiv').innerHTML = `
                    <p class="color1 h3">loading...</p>
                `
                const data = await this.U.getStockData(str.trim())
                if(!data?.queryCount){// symbol not found
                    this.U.updateDataBoxes()
                    this.U.clearAllChartCanvas()
                    this.U.clear_X_axis()
                    this.d.draw = false
                    this.U.s('#mesageDiv').style.display = 'flex'
                    this.U.s('#mesageDiv').innerHTML = `
                        <pre class="h3 color1 pd">Symbol not found</pre>
                    `
                    return
                }
                this.d.draw = true
                this.U.updateCandleData(data)
            },
            'clear_X_axis':()=>{
                const ctx = this.U.s('#canvas_xAxis').getContext('2d');
                ctx.clearRect(0,0,  this.canvas_xAxis.getWidth(), this.canvas_xAxis.height )
            },
            'removeFromString':(mainString, stringsToRemove) =>{
                let resultString = mainString;
                for (let str of stringsToRemove) {
                    let regex = new RegExp(str, 'g');
                    resultString = resultString.replace(regex, '');
                }
                return resultString;
            },
            'setCandles':()=>{
                const d = this.d
                let numberOfCandles = Math.min(this.ohlc.close.length, 600)
                const candleGap = (this.d.wd - this.marginX)/numberOfCandles
                this.d.initialXGap = Math.max(1,candleGap)
        
                this.xPositions = this.ohlc.close.map((v,i)=> { return {x:(i - d.inframeCandleIndex) * (d.initialXGap*4), i:i}} ) 
                const idx = this.U.getOuterCandlesIndex()
                this.inFrameCandles = this.xPositions.slice(idx.left, idx.right)
                this.d.xGap = this.inFrameCandles[2].x - this.inFrameCandles[1].x 
                let length = this.inFrameCandles.length 
                let gap = (this.d.wd ) / length
                this.U.setCandlesAndWicks()
                this.inFrameCandles = this.inFrameCandles.map((v,i)=> { return {x: (i * gap) - 50, i:v.i}} ) 
                this.U.identifyMarketZones()
            },
            'setCandlesAndWicks':()=>{
                this.candles = []
                this.wicks = []
                this.ohlc.close.forEach((v,i)=> {
                    let color = this.ohlc.open[i] < this.ohlc.close[i] ? this.color.upCandle : this.color.downCandle
                    this.candles.push({ 'color': color, })
                    this.wicks.push({
                        'width': 1, 
                        'color': color
                    }) 
                })
            },
            // 'updateStudyLevel':(ind)=>{
            //     this.U.removeStudy(ind.nameId ,{deleteData: false} )
            //     this.U.addIndicator(ind)
            //     this.U.ajustChartSizes()
            // },
            'findValueByKey':(obj, keyToFind) =>{
                // Check if the key exists in the current object
                if (keyToFind in obj) {
                    return obj[keyToFind];
                }
            
                // Recursively check each sub-object
                for (let key in obj) {
                    if (obj[key] !== null && typeof obj[key] === 'object') {
                        let result = this.U.findValueByKey(obj[key], keyToFind);
                        if (result !== undefined) {
                            return result;
                        }
                    }
                }
            
                // Return undefined if the key is not found
                return undefined;
            },
            'fadeInOutCharts':(obj={})=>{
                const allCtx = this.U.getAllCtx()
                let alpha = 1.0; // Start fully opaque
                let isFading = false;
                let fadingOut = true;
                let fadeDuration = obj.delay || 500; // Adjusted duration for a slower fade
            
                const fadeAnimation = (timestamp) => {
                    if (!isFading) { return; }// Stop the animation if not fading
                    const elapsedTime = timestamp - lastTimestamp;
                    const normalizedTime = elapsedTime / fadeDuration;
                    if (fadingOut) {
                        alpha = Math.max(1 - normalizedTime, 0); // Decrease alpha
                        if (alpha === 0) {
                            obj.func?.()
                            fadingOut = false; // Start fading in
                            lastTimestamp = timestamp; // Reset timestamp for fade-in
                        }
                    } else {
                        alpha = Math.min(normalizedTime, 1); // Increase alpha
                        if (alpha === 1) { isFading = false; } // Stop fading as fade-in is complete
                    }
                
                    allCtx.forEach(ctx => ctx.globalAlpha = alpha)
                    this.U.draw('fadeInOutCharts');
                    requestAnimationFrame(fadeAnimation);
                };
                
                // Initialize the lastTimestamp on button click
                let lastTimestamp;
                if (!isFading) {
                    isFading = true;
                    fadingOut = true;
                    lastTimestamp = performance.now();
                    requestAnimationFrame(fadeAnimation);
                }
            },
            'onPinch':(ev)=>{
                const d = this.d
                const middlePoint = this.U.getMiddlePointOfTouches(ev)
                const range = Math.abs(middlePoint.diff)
                if(d.multiTouchDeltaX == null){
                    d.multiTouchDeltaX = 0
                    d.multiTouchRangeX = range
                    d.offsetX = middlePoint.x
                }else if(d.multiTouchRangeX != range) {
                    d.multiTouchDeltaX = (d.multiTouchRangeX - range) > 0 ? 1 : -1
                    d.multiTouchRangeX = range
                    d.deltaY = d.multiTouchDeltaX
                    d.inframeCandleIndex = this.U.getInframeCandlesIndex(d.offsetX)
                }
                d.deltaX = 0
                d.velocity = 0
                this.U.draw('onTouchMove 3')
            },
            'onTouchStart':(ev)=>{
                const d = this.d
                d.eventType = ev.type
                d['time'] = Date.now()
                d.timeGap = d['time'] - this.d['lastTouched']
                if(d['doubleTap']){d['doubleTap'] = false}
                d['doubleTap'] = d.timeGap < 500 && d.ttlDelta < 50 ? true : false 
                d.ttlDelta = 0
                d['lastTouched'] = d['time']
                d['deltaX'] = 0
                d['velocity'] = 0;
                d['zoomReset'] = false
                d['offsetX'] = ev.targetTouches[0].pageX - this.U.r(this.U.s('#canvas_main')).x
                d['offsetY'] = ev.targetTouches[0].pageY - this.U.r(this.U.s('#canvas_main')).y
                d['lastX'] = ev.touches[0].clientX;
                d['lastY'] = ev.touches[0].clientY;
        
                this.longPressTimer = setTimeout(() => {
                    d.longPress = true;
                }, 500);
                
                if(ev.touches.length >1){
                    this.U.clearLongPressTimer()
                }
                
                this.U.draw()
            },
            'onTouchMove':(ev)=>{ 
                let eventName  = 'onTouchMove --- '
                let eventType = ev.type
                if(ev.touches.length > 1){ ev.preventDefault() }
                const d = this.d
        
                d['dX'] = d['lastX'] - ev.touches[0].clientX
                d['dY'] = d['lastY'] - ev.touches[0].clientY
                d['lastX'] = ev.touches[0].clientX;
                d['lastY'] = ev.touches[0].clientY;
                d['deltaXSum'] += Math.abs(d['dX'])
                d['deltaYSum'] += Math.abs(d['dY'])
                d['deltaX'] = d.dX
        
                //crosshair logic
                const chart = [...this.U.s('.chart:not(#canvas_background):not(#canvas_top)')].find(chart=> this.U.r(chart).y + this.U.r(chart).height > d.lastY )
                if(chart){
                    d.crossHairTarget = chart
                    d.crossHairOffsetY = d.lastY - this.U.r(chart).y
                }
        
                if(d.ttlDelta>20 && !d.longPress){
                    this.U.clearLongPressTimer()
                }
                
                if(ev.target.id == 'canvas_xAxis'){
                    let idx = this.U.findIndexInframe(this.inFrameCandles, d.wd)
                    d.inframeCandleIndex = idx
                    d.deltaX = 0
                    d.touchDeltaFactor = 1.5
                    d.deltaY = -d.dX 
                    this.U.draw(eventName)
                    return
                }
        
                if(d.deltaXSum > 30 && d.deltaYSum < 30){
                    d.deltaYSum = 0
                    d.horizontalDrag = true
                    d.verticalDrag = false
                }
                if(d.deltaYSum > 30 && d.deltaXSum < 30){
                    d.deltaXSum = 0
                    d.horizontalDrag = false
                    d.verticalDrag = true
                }
        
                if (d['isDragging'] && !d['doubleTap'] && d.horizontalDrag && d.eventType != 'multiTouch'){
                    ev.preventDefault()
                    d['timeDiff'] = Date.now() - d['time'];
                    d['velocity'] = (d['deltaX'] / (d['timeDiff']*.05));
                    this.U.draw('onTouchMove 1')
                }
        
                // zoom 
                if (d['doubleTap'] && ev.touches.length ==1){
                    ev.preventDefault()
                    d['zoomReset'] = !d['zoomReset'] ? true : d['zoomReset']
                    d['velocity'] = 0;
                    d['deltaY'] = d['dY']
                    d['deltaX'] = 0
                    this.U.clearLongPressTimer()
                    d.inframeCandleIndex = this.U.getInframeCandlesIndex(d.offsetX)
                    this.U.draw('onTouchMove 2')
                }
                if(ev.touches.length >= 2){ ev.preventDefault() }
                if(ev.touches.length == 2){
                    eventType = 'multiTouch'
                    d.touchDeltaFactor = 1.5
                    this.U.onPinch(ev)
        
                }
                if(d.longPress && ev.touches.length ==1){
                    ev.preventDefault()
                    d['deltaX'] = 0
                    d['velocity'] = 0;
                    d.crossHairOffsetX -= d.dX
                    d.crossHairOffsetY -= d.dY
                    this.U.draw()
                }
                
                d.eventType = d.eventType == 'multiTouch' ? 'multiTouch' : eventType
                d.ttlDelta += Math.abs(d['dX'])
                d['time'] = Date.now();
            },
            'onTouchEnd':(ev)=>{
                const event = 'onTouchEnd ---- '
                const d = this.d
                this.U.clearLongPressTimer()
                d['isDragging'] = false
                d['doubleTap'] = false
                d['velocity'] = (Date.now() - d.time) > 100 ? 0 : d['velocity']
                d.velocity = d.velocity > 0 ? Math.min(d.velocity, 200) : Math.max(d.velocity, -200)
                d.touchDeltaFactor = 1
        
                const animateInertia = ()=> {
                    if (Math.abs(d['velocity']) > 0.1) {
                        d.deltaX = d['velocity']
                        d['velocity'] *= 0.97;
                        this.U.draw(event);
                        requestAnimationFrame(animateInertia);
                    }
                }
                if(d.eventType != 'multiTouch'){ animateInertia(); }
                d.deltaX = 0
                d.deltaY = 0
                d.multiTouchDeltaX = null
                d.multiTouchRangeX = null
                d['deltaXSum'] = 0
                d['deltaYSum'] = 0
            },
            'onWheel':()=>{
                const d = this.d
                this.U.s('#frame').addEventListener('wheel', (ev)=>{
                    if(ev.target.className.includes('resize')){
                        ev.preventDefault();
                        d.eventType = ev.type
                        d.inframeCandleIndex = this.U.getInframeCandlesIndex(ev.offsetX)
                        d.deltaX = ev.deltaX 
                        d.deltaY = ev.deltaY
                        this.U.draw('onWheel')
                        this.U.resetDeltas(()=>{
                            d.deltaX = 0
                            d.deltaY = 0
                        },100)()
                    }
                })
                this.U.s('#frame').addEventListener('touchstart', (e) => this.U.handleTouch(e, 'onTouchStart'))
                this.U.s('#frame').addEventListener('touchend',  (e) => this.U.handleTouch(e, 'onTouchEnd'))
                this.U.s('#frame').addEventListener('touchmove', (e) => this.U.handleTouch(e, 'onTouchMove'))
            },
            'onMouseMove':()=>{
                const d = this.d
                this.U.s('#frame').addEventListener('mousemove', (ev)=>{
                    if(!d.draw){ return }
                    d.eventType = ev.type
                    d.deltaX=0
                    d.deltaY=0
                    d.candleIdx = this.U.getDataCandleIndex(ev.offsetX)
                    d.offsetX = ev.offsetX
                    d.offsetY = ev.offsetY
                    d.crossHairOffsetX = ev.offsetX
                    d.crossHairOffsetY = ev.offsetY
                    d.longPress = true
                    
                    d.event = ev
                    d.crossHairTarget = ev.target
        
                    if(ev.target.tagName == 'CANVAS'){ 
                        this.U.updateDataBoxes(d.candleIdx) 
                        this.U.draw('onMouseMove')
                    }
                })
            },
            'onResize':()=>{
                this.U.sizeObserver()
            },
            'onClick':()=>{
                // close div on outside click
                const body = document.querySelector('body')
                body.addEventListener('click', (ev)=>{
                    const elements = body.querySelectorAll('.hide_when_outside_click')
                    const isExcluded = (ev.target.classList.contains('dontRun') || ev.target.classList.contains('actionBtn'))
                    const path = ev.composedPath()
                    elements.forEach(el=>{
                        if(isExcluded || path.includes(el)){return}
                        el.style.display = 'none'
                    })
                })
            },
            // 'openStudySettings':(nameId)=>{
            //     //open study
            //     this.d.openedIndicator = nameId
            //     this['dinamicDiv'].name = 'openStudySettings'
            //     this['dinamicDiv'].style.display = 'flex'
            //     this['dinamicDiv'].querySelector('.title').innerText = this.indicators.list[nameId].name
            //     this['dinamicDiv'].querySelector('#divContent').innerHTML = ''
        
            //     const ind = this.indicators.list[nameId]
                
            //     let cloudSection = ''
            //     if('cloudInputs' in ind){
            //         let checked = ind.cloudInputs.showCloud ? 'checked' : ''
        
            //         const options = Object.keys(ind.plots).map(v=>{
            //             return `<option value="${v}" >${this.U.splitBeforeUppercaseAndJoin(v)}</option>`
            //         })
                    
            //         let vals = ind.cloudInputs.values.map(v=>this.U.setSelectedOption(options,v))
        
            //         cloudSection = `
            //             <div class="df cloudInputDiv indicatorSettingsDiv">
            //                 <h3 class="title color1 text1">Cloud Settings</h3>
                            
            //                 <form class="cloudForm df">
            //                     <div class="df jcse settingsSecton">
            //                         <label for="showCloud_input" class="color1 text1">Show Cloud</label>
            //                         <input class="inputsType showCloud" type="checkbox" ${checked} id="showCloud_input" name="showCloud_input">
            //                     </div>
            //                     <div class="df jcse settingsSecton">
            //                         <label for="cloudValues_input_1" class="color1">Values</label>
            //                         <select class="cloudInput" id="cloudValues_input_1">${vals[0]}</select>
            //                         <select class="cloudInput" id="cloudValues_input_2">${vals[1]}</select>
            //                     </div>
            //                     <div class="df jcse settingsSecton">
            //                         <label for="cloudColor_1" class="color1">Colors</label>
            //                         <div class="dropDown-btn actionBtn cloud-color" value="${ind.cloudInputs.colors[0]}" data-action="showColors" style="background-color:${ind.cloudInputs.colors[0]};"></div>
            //                         <div class="dropDown-btn actionBtn cloud-color" value="${ind.cloudInputs.colors[1]}" data-action="showColors" style="background-color:${ind.cloudInputs.colors[1]};"></div>
            //                     </div>
            //                 </form>
            //             </div>
            //         `
            //     }
        
            //     const colorOptions = Object.keys(this.color.list).reduce((accu, v)=>{
            //         return accu + `<div class="menu-option-color" value="${this.color.list[v]}" style=" background-color:${this.color.list[v]}"></div>`
            //     },'')
            //     this['dinamicDiv'].querySelector('#divContent').innerHTML = `
            //         <div class="df indicatorSettingsDiv inputDiv">
            //             <h3 class="title color1 text1">Inputs</h3>
            //             <form class="inputsForm df"></form>
            //         </div>
                    
            //         <div class="df indicatorSettingsDiv">
            //             <h3 class="title color1 text1">Style</h3>
            //             <form class="stylesForm df"></form>
            //         </div>
            //         ${cloudSection}
            //         <div class="dropDown-container hide_when_outside_click">
            //             <div class="actionBtn" data-action="selectColor">
            //                 ${colorOptions}
            //             </div>
            //         </div>
            //     `
        
            //     //adding inputsForm content
            //     for (let key of Object.keys(ind.inputs)){
            //         let formattedName = this.U.splitBeforeUppercaseAndJoin(key)
            //         let innerHtml = `
            //             <div class="df jcse settingsSecton" >
            //                 <label for="${key}_input" class="color1">${this.U.capitalize(formattedName)}</label>
            //                 <input class="inputsType" type="number" id="${key}_input" name="${key}_input" value="${ind.inputs[key]}">
            //             </div>
            //         `
            //         if(key == 'priceType' || key == 'level'){
            //             let clas = key == 'level' ? '': 'inputsType'
            //             let data = this.U.findValueByKey(ind, key)
            //             let options = this.U.setSelectedOption(this.plotOptions[key], data)
                        
            //             innerHtml = `
            //                 <div class="df jcse settingsSecton">
            //                     <label for="${key}_input" class="color1">${this.U.capitalize(formattedName)}</label>
            //                     <select class="${clas}" id="${key}_input" name="${key}_input" >${options}</select>
            //                 </div>
            //             `
            //         }
            //         if(key == 'MovAvgType'){
            //             const movAvgOptions = ['SMA','EMA'].map(v=>{ return `<option value="${v}" >${v}</option>` })
            //             let vals = this.U.setSelectedOption(movAvgOptions, ind.inputs.MovAvgType)
            //             innerHtml = `
            //                 <div class="df jcse settingsSecton" >
            //                     <label for="${key}_input" class="color1">${this.U.capitalize(formattedName)}</label>
            //                     <select class="inputsType" id="${key}_input" name="${key}_input" >${vals}</select>
            //                 </div>
            //             `
            //         }
        
            //         this['dinamicDiv'].querySelector('.inputsForm').innerHTML += innerHtml
            //     }
        
            //     // setting inputs elements to indicators values
            //     this['dinamicDiv'].querySelectorAll('.inputsForm .inputsType').forEach(el=>{
            //         const name = el.name.split('_')[0]
            //         const priceType = ind.inputs[name]
            //         if(el.type === 'checkbox'){ el.checked = priceType }
        
            //         el.querySelectorAll('option').forEach(op=>{
            //             if(op.value == priceType){ op.setAttribute('selected', true); }
            //         })
            //     })
        
            //     //style innerHtml
            //     for(let k of Object.keys(ind.plots)){
            //         let formattedName = this.U.splitBeforeUppercaseAndJoin(k)
            //         let val = ind.plots[k].plotType
            //         let plotOptions = this.U.setSelectedOption(this.plotOptions['plotType'], val)
            //         this['dinamicDiv'].querySelector('.stylesForm').innerHTML += `
            //             <div class="df settingsSecton" >
            //                 <div class="df">
            //                     <input class="showPlot" type="checkbox" name="${k}" >
            //                     <label for="${k}_color" style="color: ${this.color.textColor1}">${formattedName}:</label>
            //                     <div class="dropDown-btn menu-color actionBtn" name="${k}" value="${ind.plots[k].color}" data-action="showColors" style="background-color:${ind.plots[k].color};"></div>
            //                     <select id="${k}_select" class="styleType plotType" name="${k}" >${plotOptions}</select>
            //                 </div>
            //                 <div class="df">
            //                     <label for="${k}_thickness" class="color1">Thickness:</label>
            //                     <select id="${k}_thickness" name="${k}" class="styleType plotWidth">
            //                         <option value="1">1</option>
            //                         <option value="2">2</option>
            //                         <option value="3">3</option>
            //                         <option value="4">4</option>
            //                     </select>
            //                 </div>
            //             </div>
            //         `
            //     }
        
            //     this['dinamicDiv'].querySelectorAll('.stylesForm .showPlot').forEach(el=>{
            //         const name = el.name
            //         if(ind.plots[name].showPlot){el.setAttribute('checked', true)}
            //     })
                
            //     //prevent default for input tags so that the window doesnt close when enter is tapped
            //     this['dinamicDiv'].querySelectorAll('input').forEach(el=>{
            //         el.addEventListener('keydown',(ev)=>{
            //             if (ev.key === 'Enter') { ev.preventDefault(); }
            //         })
            //     })
        
            //     this['dinamicDiv'].querySelector('#cancel-btn').innerText = 'Remove'
            //     this['dinamicDiv'].querySelector('#cancel-btn')
            //     .setAttribute('data-action', `run-removeStudy-${nameId} run-ajustChartSizes closeDinamicDiv`);
            //     this['dinamicDiv'].style.display = 'block'
            //     this.U.handleBtn()
            // },
            'placeValuePercentage':(value, chart_height, min, max, margin) =>{
                chart_height = chart_height || this.chart_height
                min = min || this.newMin
                max = max || this.newMax 
                margin = margin || {'t': this.margin.t, 'b':this.margin.b}
                if(value == null){return value }
                let val = ((max-value+((max-min)*margin.t))/
                (max-min+((max-min)*(margin.t + margin.b))) * chart_height);
                return val
            },
            'placeValue':(value, chart_height, min, max, margin) =>{
                chart_height = chart_height || this.chart_height
                min = min || this.newMin
                max = max || this.newMax 
                margin = margin || {'t': this.margin.t, 'b':this.margin.b}
                if (value == null) { return value; }
                let effectiveHeight = chart_height - margin.t - margin.b; // Adjust chart height for margins
                let normalizedValue = (value - min) / (max - min); // Normalize value to range 0-1
                let scaledValue = normalizedValue * effectiveHeight; // Scale value based on effective height
                let finalValue = chart_height - margin.b - scaledValue; // Position value within chart considering bottom margin
                return finalValue;
            },
            'prepContainer':()=>{
                this.container.style = `
                    width: 100%;
                    overflow-x: hidden;
                    position: relative;
                    overflow: hidden;
                `
                this.container.classList.add('scrollbar0')
                return this.U.r(this.container).width
            },
            'resetDeltas':(func, delay = 500) =>{
                const d =this.d
                let timerId;
                
                return function () {
                    const context = this;
                    const args = arguments;
                    if( d.debounceCount == d.debounceReset ){
                        clearTimeout(timerId);
                        timerId = setTimeout(() => {
                        func.apply(context, args);
                        d.debounceCount = 0
                        d.debounceReset = 0
                        }, delay);
                    }
                    d.debounceCount +=1
                };
            },
            // 'removeStudy':(data, obj={deleteData: true})=>{
            //     const ind = this.indicators.list[data]
            //     if(obj.deleteData){delete this.indicators.list[data]}
            //     this.U.s('#studyInfoBox').querySelectorAll(`#${data}_div`).forEach(el=>el.remove())
            //     if(this.U.s('#studyInfoBox').children.length == 0) {this.U.s('#studyInfoBox').style.display = 'none'}
            //     this.U.s(`#frame`).querySelectorAll(`#canvas_${ind.nameId}_row`).forEach(el=>el.remove())
            //     delete this[`canvas_${ind.nameId}`]
            //     delete this[`canvas_${ind.nameId}_xAxis`]
            //     delete this[`canvas_${ind.nameId}_yAxis`]
            //     this.indicators.updatePlots()
            //     this.U.draw('removeStudy')
            // },
            's':(e)=>{
                if(e.split('')[0]=='#'){return this.container.querySelector(e)}
                else{return this.container.querySelectorAll(e)}
            },
            'setCSS':()=>{
                const styles = [`*{
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                        font-family:${this.font.family};
                    }`,
        
                    `.ignore-js-events {
                        pointer-events: none;
                    }`,
        
                    `table {
                        width: min-content;
                    }`,
        
                    `td.min {
                        position: relative;
                        width: 1%;
                        white-space: nowrap;
                    }`,
        
                    `table, tr, td {
                        border-collapse: collapse;
                        padding: 0px;
                    }`,
        
                    `#frame {
                        width: 100%;
                        position: relative;
                        cursor: crosshair;
                    }`,
                    `#frame > div {
                        overflow:hidden;
                    }`,
                    `#frame * { user-select: none; }`,
        
                    // `#settingsBox {
                    //     display: none;
                    //     position: absolute; 
                    //     height: auto;
                    //     width: auto;
                    //     min-width: 300px;
                    //     background-color: ${this.color.b3};
                    //     border: 1px solid hsl(220, 20%, 30%);
                    //     transform: translate(-50%, -50%);
                    //     top: 50vh;
                    //     left: 50vw;
                    //     z-index: 100;
                    // }`,
        
                    `#dinamicDiv {
                        display: none;
                        position: fixed; 
                        height: auto;
                        max-width: 800px;
                        width: 100%;
                        background-color: ${this.color.b3};
                        border: 1px solid hsl(220, 20%, 30%);
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        z-index: 200;
                        flex-direction: column;
                    }`,
                    `#mesageDiv {
                        display: none;
                        align-items: center;
                        padding: 10px;
                        position: fixed; 
                        height: auto;
                        max-width: 300px;
                        width: min-content;
                        background-color: ${this.color.b3};
                        border: 1px solid hsl(220, 20%, 30%);
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        z-index: 200;
                        flex-direction: column;
                    }`,
                    `#submit {
                        gap: 10px;
                        padding-left:20px;
                        padding-right:20px;
                        justify-content: space-between;
                    }`,
                    `#divContent{
                        overflow-y: scroll;
                        max-height: 73vh;
                        padding: 20px;
                        position:relative;
                    }`,
                    `#divContent > *:not(:last-child) {
                        margin-bottom:20px;
                    }`,
                    `#divContent form {
                        width:100%;
                    }`,
                    `.indicatorSettingsDiv {
                        width:100%;
                        padding: 20px;
                        border: 1px solid ${this.color.b2};
                        border-radius: 5px;
        
                    }`,
                    `.indicatorSettingsDiv * input{
                        width: 60px;
                    }`,
                    `form > div {
                        flex-basis: auto; 
                        column-gap: 15px; 
                        min-height:40px;
                        padding: 5px 10px;
                    }`,
                    `select {cursor: pointer;}`,
                    `input[type="checkbox"]{cursor: pointer;}`,
                    `#divContent input[type="checkbox"]{
                        height:25px;
                        width:25px;
                    }`,
                    `#divContent .indicatorBtnsDiv{
                        display: flex;
                        flex-wrap: wrap;
                        gap: 10px;
                    }`,
                    // `.rel{position:relative;}`,
                    // `.abs{position:absolute;}`,
                    // `.pd{padding: 10px}`,
                    `.pt{padding-top: 10px}`,
                    `.pb{padding-bottom: 10px}`,
                    `.dn{display:none;}`,
                    `.db{display:block;}`,
                    // `.dib{display: inline-block;}`,
                    `.df{ display:flex; flex-wrap: wrap; gap:10px; align-items: center}`,
                    `.df * { margin: 0;}`,
                    `.aic{align-items: center;}`,
                    `.jcsb{justify-content: space-between;}`,
                    `.jcsa{justify-content: space-arround;}`,
                    `.jcse{justify-content: space-evenly;}`,
                    `.jcc{justify-content: center;}`,
                    `.fdc{flex-direction: column;}`,
                    `.fg{flex-grow:1}`,
                    `.color1{ color:${this.color.textColor1}}`,
                    `.bdb {border: 1px solid;}`,
                    `.bdr {border: 1px solid red;}`,
                    `.bd-t {border-top: 1px solid ${this.color.line};}`,
                    `.bd-t2 {border-top: 1px solid ${this.color.line2};}`,
                    `.bd-l {border-left: 1px solid ${this.color.line};}`,
                    `.bd-r {border-right: 1px solid ${this.color.line};}`,
                    `.bd-b {border-bottom: 1px solid ${this.color.line};}`,
                    `.mt {margin-top: 10px;}`,
                    `.mb {margin-bottom: 10px;}`,
                    `.ml {margin-left: 10px;}`,
                    `.mr {margin-right: 10px;}`,
                    `.hover1 {padding: 4px 8px; cursor: pointer;}`,
                    `.hover1:hover {background-color: gray;}`,
                    `.hover1:active {background-color: gray;}`,
                    `.selected1 {background-color: gray;}`,
                    `.btn1{
                        background: rgba(0, 0, 0, 0);
                        border: 1px solid ${this.color.line};
                        border-radius: 5px;
                        color: white;
                        justify-content: center;
                        padding: 3px 10px;
                        cursor:pointer;
                    }`,
                    `.btn1:hover{
                        background: hsl(220 30% 50%)
                    }`,
                    `.btn2{
                        background: rgba(0, 0, 0, 0);
                        border: 0px;
                        border-radius: 3px;
                        color: white;
                        justify-content: center;
                        padding: 3px;
                    }`,
                    `.btn2:hover{
                        background: hsl(220 30% 50%)
                    }`,
                    `.btn3{
                        background: rgba(0, 0, 0, 0);
                        border: 1px solid ${this.color.line};
                        border-radius: 5px;
                        color: white;
                        justify-content: center;
                    }`,
                    `.btn3:hover{
                        background: hsl(220 30% 50%)
                    }`,
                    `.studies_btn{
                        width: 30%;
                        min-width: min-content;
                    }`,
                    `.text1{
                        font-weight: 300;
                    }`,
                    `/* width */
                    .scrollbar0::-webkit-scrollbar { 
                        width: 3px; 
                        height: 3px;
                    }`,
                    `/* Track */
                    .scrollbar0::-webkit-scrollbar-track {
                        box-shadow: inset 0 0 5px rgba(0, 0, 0, 0); 
                        border-radius: 3px;
                    }`,
                    `/* Handle */
                    .scrollbar0::-webkit-scrollbar-thumb {
                        background: hsl(220 60% 60%); 
                        border-radius: 3px;
                    }`,
        
                    `/* width */
                    .scrollbar1::-webkit-scrollbar { 
                        width: 6px; 
                        height: 6px;
                    }`,
                    `/* Track */
                    .scrollbar1::-webkit-scrollbar-track {
                        box-shadow: inset 0 0 5px rgba(0, 0, 0, 0); 
                        border-radius: 3px;
                    }`,
                    `/* Handle */
                    .scrollbar1::-webkit-scrollbar-thumb {
                        background: hsl(220 60% 60%); 
                        border-radius: 6px;
                    }`,
                    `#stock-input{
                        padding-left: 5px;
                        max-width: 150px;
                        text-transform:uppercase;
                    }`,
                    `#toolsBar{
                        display: flex;
                        padding: 6px;
                        gap: 10px ;
                        width: 100%;
                        flex-wrap: nowrap;
                        overflow-x: scroll;
                        background-color:${this.color.b3};
                        z-index: 200;
                    }`,
                    `.infoBox {
                        display: flex; 
                        white-space: nowrap;
                        text-wrap: nowrap;
                        margin-right: 8px; 
                        padding: 0 8px 3px 0;
                        border-radius: 3px; 
                        border:1px solid ${this.color.line};
                        background-color:${this.color.b3};
                    }`,
                    `.infoBox:last-child {
                        margin-right: 0px; 
                    }`,
                    `#studyInfoBox {
                        position:absolute; 
                        margin-top:7px;
                        padding: 3px;
                        z-index:50;
                        width:min:min-content;
                        max-width:95%;
                        border:1px solid ${this.color.line};
                        border-radius:5px;
                        height:min-content; 
                        top:${25 + this.d.marginTop}px; 
                        left:10px;
                        background-color:${this.color.b3};
                        overflow-x:scroll;
                    }`,
        
                    `#upperInfoBox {
                        display: inline-flex; 
                        position:absolute; 
                        width:min-content; 
                        max-width:95%;
                        height:min-content; 
                        flex-wrap: nowrap;
                        text-wrap: nowrap;
                        white-space: nowrap;
                        top:${5 + this.d.marginTop}px; 
                        left:10px;
                        color:${this.color.textColor1};
                        border-radius: 3px; 
                        border: 1px solid ${this.color.line};
                        background-color:${this.color.b3};
                        padding: 5px;
                        padding-block: 2px;
                        z-index:50;
                    }`,
                    `#upperInfoBox p:last-child {
                        margin-right:0px
                    } `,
                    `#upperInfoBox p:nth-child(even) {
                        margin-left:2px;
                        margin-right:8px;
                    } `,
        
                    `.menuBtn{
                        position: </el2.length>ative;
                        cursor: pointer;
                    }`,
                    `.menuBtn:hover{
                        background: hsl(220 30% 50%)
                    }`,
                    `.menuContent{
                        position: absolute;
                        display: none;
                    }`,
                    `.actionBtn, .actionBtn * {
                        cursor: pointer;
                    }`,
                    `.checkBtn{
                        border: 1px solid ${this.color.line};
                        display: flex;
                        gap: 8px;
                        padding: 5px 10px;
                        border-radius: 5px;
                        align-items: center;
                    }`,
                    `.checkBtn * { 
                        margin: 0;
                    }`,
                    `.checkBtn input{ 
                        height:25px;
                        width:25px;
                    }`,
                    `.hoverColor1:hover{
                        background: hsl(220 30% 50%);
                    }`,
                    `#scrollBtn{
                        position: absolute;
                        bottom: 10px;
                        right: ${this.canvas_main_yAxis.width + 20}px;
                        z-index:50;
                        background-color:white;
                        border-radius:50%; 
                        height:30px;
                        width:30px;
                    }`,
                    `.ani {transition: opacity 0.8s ease-in-out;}`,
                    `.fade { 
                        opacity: 0; 
                        pointer-events: none;
                    }`,
                    `#done-btn {
                        background-color: hsl(220 60% 60%)
                    }`,
                    `.parent {
                        display: flex;
                        flex-direction: column;
                    }`,
                    `.parent > div {
                        overflow:hidden;
                    }`,
                    `.flexHeight {
                        flex-grow: 1;
                    }`,
                    `.dropDown-btn{
                        border:1px solid ${this.color.line};
                        height: 19px; 
                        width:40px;
                        cursor: pointer;
                    }`,
                    `.dropDown-container{
                        display:none;
                        position: fixed;
                        width:300px;
                        height:auto;
                        max-height: 70%;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        border: 2px solid ${this.color.b2};
                        border-radius: 5px;
                    }`,
                    `.dropDown-container > div{
                        display: grid;
                        grid-template-columns: repeat(7, 1fr);
                        gap: 5px;
                        width:100%;
                        padding: 5px 0 5px 5px;
                        border-radius: 5px;
                        background-color: ${this.color.b1};
                        overflow-x: hidden;
                        overflow-y: scroll;
                    }`,
                    `.dropDown-container > div > *{
                        aspect-ratio: 1 / 1;
                    }`,
                    '#seachBarForm input {height:100%;}',
                    `.settingsSecton {
                        background-color: hsl(0,0%,100%, .1);
                        border-radius: 5px;
                    }`
                ] 

                let styleSheet;
                if (!document.styleSheets.length) {
                    let style = document.createElement('style');
                    document.head.appendChild(style);
                    styleSheet = style.sheet;
                } else {
                    styleSheet = document.styleSheets[0];
                }

                styles.forEach(line => {
                    try {
                        styleSheet.insertRule(line, styleSheet.cssRules.length);
                    } catch (error) {
                        console.log(error, line)
                    }
                });
            },
            'setDimentions':()=>{
                const setDpi = (canvas, set2dTransform = true) =>{
                    const id = canvas.id
                    const parentheight = getComputedStyle(canvas.closest('div')).height.slice(0, -2)
                    let dpi = window.devicePixelRatio || 1;
                    let style_height = parentheight *(dpi);
                    let style_width = getComputedStyle(canvas).width.slice(0, -2) *(dpi);
                    let Xscale = this.chart_width / style_width
                    let Yscale = this.chart_height / style_height
                    style_width *= Xscale
                    style_height *= Yscale
            
                    if(id == 'canvas_main'){
                        this.d.wd = style_width
                    }
                    
                    const ratio = Math.ceil(window.devicePixelRatio);
                    const widthValue = this[id].getWidth() 
                    const heightValue = this[id].height 
                    canvas.width = this[id].getWidth() * ratio;
                    canvas.height = this[id].height * ratio;
                    canvas.style.width = `${widthValue}px`;
                    canvas.style.height = `${heightValue}px`;
            
                    if (set2dTransform) {
                        canvas.getContext('2d').setTransform(ratio, 0, 0, ratio, 0, 0);
                    }
                }
                this.U.s('canvas').forEach(c=>setDpi(c))
            },
            'showRecentCandle':()=>{
                if(this.inFrameCandles.at(-1).i == this.xPositions.at(-1).i){
                    return
                }
                this.U.fadeInOutCharts({
                    func: () => {
                        const d = this.d
                        const length = this.inFrameCandles.length
                        const candles = this.xPositions.slice(-length).map((c, i) => {
                            return { x: this.inFrameCandles[i].x - 50 - d.xGap, i: c.i }
                        })
                        this.inFrameCandles = candles
                        d.deltaX = 0
                        d['velocity'] = 0
                    }
                })
            },
            'updateInframeCandles':()=>{
                const d = this.d
                const {inFrameCandles} = this
                if(!inFrameCandles.length){
                    console.log('no data')
                    return
                }
        
                //zooming
                if(d.deltaY !=0 && d.inframeCandleIndex >=0){
                    for (let i = 0; i < inFrameCandles.length; i++) {
                        let idxFactor = i - d.inframeCandleIndex
                        let value = idxFactor * (d.xGap * (.03 / d.touchDeltaFactor) )
                        if(d.deltaY < 0 && inFrameCandles.length > 8){ inFrameCandles[i].x += value } //zoomOut
                        if(d.deltaY > 0 && d.xGap > .8 ){ inFrameCandles[i].x -= value } //zoomIn
                        // if(d.deltaY > 0 && d.xGap > d.initialXGap ){ inFrameCandles[i].x -= value } //zoomIn
                    }
                }
        
                
                d.xGap = inFrameCandles[2].x - inFrameCandles[1].x 
                d.candleWidth = d.xGap * d.candleWidthFactor
                d.scaleX = Math.max(d.xGap/ d.initialXGap,1)
                let sc = this.U.Mf(d.scaleX)
                let idx = sc >= 32 ? 4 : 3
                idx = sc >= 16 && sc < 32 ? 5 : idx
                idx = sc >= 8 && sc < 16 ? 10 : idx
                idx = sc >= 4 && sc < 8 ? 20 : idx
                idx = sc >= 2 && sc < 4 ? 40 : idx
                idx = sc < 2 ? 80 : idx
        
                // appending more candles when left td.xGap is greater than d.xGap
                const threshold = -(d.xGap/2)
                const leftCandle = inFrameCandles[0]
                const leftGap = leftCandle.x
                const rightCandle = inFrameCandles.at(-1)
                const rightGap = d.wd - rightCandle.x
                const leftArrLen = Math.max(10, Math.floor(leftGap/d.xGap))
                const rightArrLen = Math.max(10, Math.floor(rightGap/d.xGap))
                const leftVal = Math.min(leftArrLen,leftCandle.i)
                const rightVal = Math.min(rightArrLen, this.ohlc.close.length -1 - rightCandle.i )
        
                if(leftGap > threshold && leftVal){
                    const numbers = Array.from({ length: leftVal }, (_, index) => (leftVal*-1)-1 + index + 1);
                    const dic = numbers.map(i => {return { x: leftCandle.x + (d.xGap * i), i:leftCandle.i + i }})
                    inFrameCandles.unshift(...dic)
                }
        
                // appending more candles when right td.xGap is greater than d.xGap
                if( rightGap > threshold && rightVal){
                    const numbers = Array.from({ length: rightVal }, (_, index) => index + 1);
                    const dic = numbers.map(i => {return { x: rightCandle.x + (d.xGap * i), i:rightCandle.i + i }})
                    inFrameCandles.push(...dic)
                }
                
                // translating
                let leftDistance = Math.max((d.wd * .6) - leftCandle.x, 0)
                let rightDistance = Math.max(rightCandle.x - (d.wd * .4), 0)
                let valLeft = Math.min( leftDistance, Math.max(-d.deltaX, 0))
                let valRight = Math.min( rightDistance, Math.max(d.deltaX, 0))
                const val = d.deltaX < 0 ? valLeft : -valRight
                inFrameCandles.forEach(v => v.x += val)
                
                this.inFrameCandles = inFrameCandles.filter(c => c.x > threshold && c.x + -(d.xGap*1.5) < d.wd )
                this.xInterval = inFrameCandles.filter(c => c.i % idx == 0)
        
                //handling scroll button visibility
                const hideScrollBtn = inFrameCandles.at(-1).i > this.xPositions.length - 20
                const btn = this.U.s('#scrollBtn')
                if(hideScrollBtn){btn.classList.add('fade')}
                else{btn.classList.remove('fade')}
            },
            // 'showIndicatorsList':()=>{
            //     this['dinamicDiv'].name = 'showIndicatorsList'
            //     this['dinamicDiv'].querySelector('#divContent').innerHTML = ''
            //     this['dinamicDiv'].querySelector('.title').innerText = 'Indicators'
            //     // this['dinamicDiv'].querySelector('#apply-btn').innerText = 'Done'
            //     const div = document.createElement('div')
            //     div.classList.add('indicatorBtnsDiv')
            //     this.U.s('#divContent').appendChild(div)
        
            //     for (let btn of Object.keys(this.indicatorsFormulas)){
            //         div.appendChild(this.indicatorsBtns[btn])
            //     }
            //     this['dinamicDiv'].style.display = 'block'
            // },
            'setStockInputEvents':()=>{
                const input = this.U.s('#stock-input');
                this.U.s('#seachBarForm').addEventListener('submit', async (ev) => {
                    ev.preventDefault(); // Prevent the default form submit action
                    const symbol = input.value.toUpperCase();
                    this.U.searchSymbol(symbol);
                    input.blur();
                });
            
                input.addEventListener('click', function(event) {
                    input.select(); // Select all text inside the input
                });
            },
            // 'updateIndicator':()=>{
            //     if(this['dinamicDiv'].name != 'openStudySettings'){
            //         return
            //     }
            //     const indNameId = this.d.openedIndicator
            //     const indicator = this.indicators.list[indNameId]
            //     const stylesForm = this['dinamicDiv'].querySelectorAll('.stylesForm')[0]
        
            //     //updating indicator input fields
            //     this['dinamicDiv'].querySelectorAll('.inputDiv .inputsType').forEach(el=>{
            //         const name = el.name.split('_')[0]
            //         let value = el.type == 'number' ? +el.value : el.value
            //         value = el.type == 'checkbox' ? el.checked : value
            //         indicator.inputs[name] = value
            //     })
        
            //     const cloudSection = this['dinamicDiv'].querySelector('.cloudInputDiv')
            //     if(cloudSection){
            //         const showCloudInput = cloudSection.querySelector('.showCloud')
            //         indicator.cloudInputs.showCloud = showCloudInput.checked 
        
            //         const selects = [...cloudSection.querySelectorAll('select')]
            //         selects.forEach((sel, i) =>{
            //             indicator.cloudInputs.values[i] = sel.value
            //         })
        
            //         const colorInputs = [...cloudSection.querySelectorAll('.cloud-color')]
            //         colorInputs.forEach((input, i) =>{
            //             indicator.cloudInputs.colors[i] = input.getAttribute('value')
            //             indicator.cloudInputs.alphaColors[i] = this.U.addAlpha(input.getAttribute('value'))
            //         })
            //     }
        
            //     indicator.updateData()
        
            //     //updating pdata colors 
            //     stylesForm.querySelectorAll(`.menu-color`).forEach(el=>{
            //         indicator.htmlEls[el.getAttribute('name')].style.color = el.getAttribute('value')
            //         indicator.plots[el.getAttribute('name')].color = el.getAttribute('value')
            //     })
            //     //updating plotType
            //     stylesForm.querySelectorAll(`.plotType`).forEach(input=>{
            //         indicator.plots[input.name].plotType = input.value
            //     })
            //     //updating plotWidth
            //     stylesForm.querySelectorAll(`.plotWidth`).forEach(input=>{
            //         indicator.plots[input.name].plotWidth = input.value
            //     })
            //     //updating showPlot
            //     stylesForm.querySelectorAll(`.showPlot`).forEach(input=>{
            //         indicator.plots[input.name].showPlot = input.checked 
            //         const pdata = this.U.s(`.${input.name}_${indicator.id}`)[0]
            //         input.checked && pdata.classList.remove("dn")
            //         !input.checked && pdata.classList.add("dn")
            //     })
        
            //     //updating level input fields
            //     const levelInput = this['dinamicDiv'].querySelector('#level_input')
            //     if( indicator.inputs.level != levelInput.value ){
            //         indicator.inputs['level'] = levelInput.value
            //         this.U.updateStudyLevel(indicator)
            //     }
                
            //     this.indicators.updatePlots()
            //     this.U.draw('updateIndicator')
            // },
            // 'updateAllIndicators':()=>{
            //     Object.values(this.indicators.list).forEach(ind =>{
            //         ind.updateData()
            //     })
            //     this.indicators.updatePlots()
            // },
            'updateYIntervals':()=>{
                const levels = this.U.generateRoundedPriceLevels(this.newMin, this.newMax, 5)
                .map( price=> ({ 'y': this.U.placeValue(price) , 'price': this.U.formatPrice(price) }) )
                this.yInterval = levels
        
                if (!this.indicators?.lowerIndicators?.length) { 
                    return; 
                }
                this.indicators.lowerIndicators.forEach(ind=>{
                    this.U.drawLowerIndicatorYAxis(ind.nameId)
                })
            },
            'updateValues':()=>{
                let idx = this.inFrameCandles
                idx = idx.length >0? [idx[0].i, idx.at(-1).i +1] : [0, this.ohlc.close.length]
            
                let globalMin = Infinity;
                let globalMax = -Infinity;
            
                // Update min and max from upper indicators
                if (this.indicators?.plots?.length) {
                    for (let plot of this.indicators.plots) {
                        if (plot.show && plot.level === "upper" && plot.type !== 'cloud') {
                            for (let value of plot.data.slice(idx[0], idx[1])) {
                                if (value !== null) {
                                    globalMin = Math.min(globalMin, value);
                                    globalMax = Math.max(globalMax, value);
                                }
                            }
                        }
                    }
                }
            
                let ohlcLow = this.ohlc.low.slice(idx[0], idx[1]);
                let ohlcHigh = this.ohlc.high.slice(idx[0], idx[1]);
                this.newMin = this.U.typeNum(Math.min(globalMin, ...ohlcLow));
                this.newMax = this.U.typeNum(Math.max(globalMax, ...ohlcHigh));
            
                // Update candles and wicks
                for (let v of this.inFrameCandles) {
                    let open = this.U.placeValue(this.ohlc.open[v.i]);
                    let high = this.U.placeValue(this.ohlc.high[v.i]);
                    let low = this.U.placeValue(this.ohlc.low[v.i]);
                    let close = this.U.placeValue(this.ohlc.close[v.i]);
                    this.candles[v.i].y = Math.min(open, close);
                    this.candles[v.i].height = Math.abs(open - close);
                    this.wicks[v.i].y = low;
                    this.wicks[v.i].height = high - low;
                }
            
                // Update min and max for lower indicators
                if(this.indicators?.lowerIndicators){
                    for (let ind of this.indicators.lowerIndicators) {
                        let indMin = Infinity;
                        let indMax = -Infinity;
                
                        for (let val in ind.plots) {
                            let plot = ind.plots[val]
                            if (plot.showPlot && plot.plotType !== 'cloud') {
                                for (let value of ind.data[val].slice(idx[0], idx[1])) {
                                    if (value !== null) {
                                        indMin = Math.min(indMin, value);
                                        indMax = Math.max(indMax, value);
                                    }
                                }
                            }
                        }

                        if(ind.staticMinVal != null) { indMin = ind.staticMinVal}
                        ind.min = indMin;
                        ind.max = indMax;
        
                        this[`canvas_${ind.nameId}`].min = indMin;
                        this[`canvas_${ind.nameId}`].max = indMax;
                    }
                }
            },
            'updateDataBoxes':(idx = -1)=>{
                // update all elements with that class pdata
                const els = this.U.s('.pdata')
                els.forEach((el)=>{
                    let clas = el.classList[1]
                    if(idx == -1){
                        el.innerText = '-- --'
                        return
                    }
        
                    // if indicator
                    if(clas[0] !='_'){
                        const info = JSON.parse(el.getAttribute('data-info'))
                        let data = this.U.formatPrice(this.indicators.list[info.group].data[info.name][idx])
                        data = data == null ? '-- --' : data
                        el.innerText = data
                    }
                    clas = clas[0] == "_" ? clas.slice(1) : clas
                    if(this.ohlc[clas]){
                        let n = this.ohlc[clas][idx]+''
                        n = n.includes('.') ? (+n).toFixed(2) : +n
                        el.innerText = n
                        // let attr = JSON.parse(el.getAttribute('data-info'))
                        // el.style.color = attr ? this.studies[attr.group][attr.name]['color'] : this.candles[idx].color
                    }
                })
            },
        }
        this.U = utilities
    }

    logInfo(){console.log(this)}
}

new CFchart(document.querySelector('#CFChart'))

(function($){
	$.nemo = {
		css: {
			bgc: '_nemo_bgc',
			o: '_nemo_o',
			x: '_nemo_x',
			ot: '_nemo_ot',
			xt: '_nemo_xt'
		},
		min: function(a,b){ return (a<b)?a:b; },
		max: function(a,b){ return (a>b)?a:b; }
	};
	$.nemo = $.extend($.nemo, {
		drag: {
			id: 0,
			start: {x:-1,y:-1},
			end: {x:-1,y:-1},
			type: $.nemo.css.ot
		},
		data: {},
		build: function(id, options){
			
			$.nemo.data[id] = $.extend({
				type: 'play',
				debug: false,
				tableId: id+'-table',
				debugId: id+'-debug',
				width: 0,
				height: 0,
				widthMax: 0,
				heightMax: 0,
				query: '',
				tds: [],
				data: [],
				save: []
			}, options);
			
			var obj=$('#'+id);
			if($.nemo.data[id].type == 'draw'){
				$('<div />').attr('id', $.nemo.data[id].tableId).appendTo(obj);
				$.nemo.buildTableForDraw(id);
			}else{
				if($.nemo.data[id].debug){
					$('<div />').attr('id', $.nemo.data[id].debugId).appendTo(obj);
					$.nemo.buildDebugInput(id);
				}
				$('<div />').attr('id', $.nemo.data[id].tableId).appendTo(obj);
				$.nemo.buildTable(id);
			}
		},
		
		buildDebugInput: function(id){
			var obj = $('#'+$.nemo.data[id].debugId);
			$('<lable>')
				.attr('for', id+'-width')
				.text('가로크기')
				.appendTo(obj);
			$('<input>')
				.attr({
					type: 'text',
					id: id+'-width',
					value: '10'
				})
				.appendTo(obj);
			obj.append('<br>');
			$('<lable>')
				.attr('for', id+'-height')
				.text('세로크기')
				.appendTo(obj);
			$('<input>')
				.attr({
					type: 'text',
					id: id+'-height',
					value: '10'
				})
				.appendTo(obj);
			obj.append('<br>');
			$('<lable>')
				.attr('for', id+'-widthMax')
				.text('왼쪽크기')
				.appendTo(obj);
			$('<input>')
				.attr({
					type: 'text',
					id: id+'-widthMax',
					value: '5'
				})
				.appendTo(obj);
			obj.append('<br>');
			$('<lable>')
				.attr('for', id+'-heightMax')
				.text('윗쪽크기')
				.appendTo(obj);
			$('<input>')
				.attr({
					type: 'text',
					id: id+'-heightMax',
					value: '5'
				})
				.appendTo(obj);
			obj.append('<br>');
			$('<textarea>')
				.attr('id', id+'-data')
				.text('3:1,1:6:1,2,1:1,3:1,1,1:3,4:4:3:2:2:1,1:3,3:1,2,2:1,4:2,3:7:1,1:1,1:1,1')
				.appendTo(obj);
			obj.append('<br>');
			$('<button>')
				.text('만들기')
				.click(function(){
					$.nemo.buildTable(id, {
						width: parseInt($('#'+id+'-width').val(),10),
						height: parseInt($('#'+id+'-height').val(),10),
						widthMax: parseInt($('#'+id+'-widthMax').val(),10),
						heightMax: parseInt($('#'+id+'-heightMax').val(),10),
						query: $('#'+id+'-data').val()
					});
				})
				.appendTo(obj);
			obj.append('<br>');
		},
		
		/**
		 * 네모로직 틀 생성
		 */
		buildTable: function(id, options){
			var config = $.nemo.data[id];
			config.tds=[];
			$.extend(config, options);
			config.query = $.trim(config.query).replace(/ /g, '');
			if(config.width <= 0
			|| config.height <= 0
			|| config.widthMax <= 0
			|| config.heightMax <= 0 
			|| config.query == '')
				return;
			
			//내부 데이타 초기화
			config.data = [];
			config.save = [];
			for(var i=0, size=config.width*config.height; i<size; i++){
				config.data[i] = 0;
				config.save[i] = 0;
			}
			
			//왼쪽위쪽 숫자채우기
			var tempData = config.query.split(':');
			if(tempData.length != config.width + config.height)
				return;
			
			var dataArr = {width:[],height:[]};
			for(var i=0, size=config.width*config.heightMax; i<size; i++)
				dataArr.width[i] = 0;
			for(var i=0, size=config.height*config.widthMax; i<size; i++)
				dataArr.height[i] = 0;
			
			for(var i=0; i<tempData.length; i++){
				var a = tempData[i].split(',');
				if(a.length == 0) return;
				if(i<config.width){
					var x = i;
					for(var j=0; j<config.heightMax; j++){
						if(j >= a.length) break;
						var y=config.heightMax-j-1;
						dataArr.width[y*config.width+x] = a[a.length-1-j];
					}
				}else{
					var y = i-config.width;
					for(var j=0; j<config.widthMax; j++){
						if(j >= a.length) break;
						var x=config.widthMax-j-1;
						dataArr.height[y*config.widthMax+x] = a[a.length-1-j];
					}
				}
			}
			
			var obj = $('#'+config.tableId);
			obj.html('');
			//도구
			var tools = $('<div>');//.appendTo(obj);
			var saveBtn = $('<button>')
				.text('임시저장')
				.attr('id', '_nemo'+id+'saveBtn')
				.attr('disabled','disabled')
				.data('id', id)
				.bind('click', function(){$.nemo.save($(this).data('id'));})
				.appendTo(tools);
			var loadBtn = $('<button>')
				.text('불러오기')
				.attr('id', '_nemo'+id+'loadBtn')
				.attr('disabled','disabled')
				.data('id', id)
				.bind('click', function(){$.nemo.load($(this).data('id'));})
				.appendTo(tools);
			//loadBtn.removeAttr('disabled');
			//테이블 그리기
			var tableWidth = config.width + config.widthMax;
			var tableHeight = config.height + config.heightMax;
			var nemoData = [];
			var table = $('<table>').addClass('_nemo_').attr('cellspacing','0').appendTo(obj);
			table.bind({
				'selectstart': function(event){
					event.preventDefault();
				},
				'contextmenu': function(event){
					event.preventDefault();
				},
				'mouseout' : function(event){
					$('td._nemo_').removeClass($.nemo.css.bgc);
				}
			});
			var ih=iw=ii=0;
			var y=-1;
			for(var h=0; h<tableHeight; h++){
				var tr = $('<tr>').addClass('_nemo_').appendTo(table);
				var x=-1;
				for(var w=0; w<tableWidth; w++){
					var td = $('<td>');
					var bl = (w<config.widthMax);
					var bt = (h<config.heightMax);
					if((h || w) && bt && bl)
						continue;
					else{
						if(h==0 && w==0){
							td.attr({
								rowspan: config.heightMax,
								colspan: config.widthMax,
								id: id+'_info'
							});
							tools.appendTo(td);
						}
						td.addClass('_nemo_')
							.addClass('_nemo'+id)
							.data('id', id)
							.appendTo(tr);
					}
					// 왼쪽/위쪽 라인 제거
					if(h==0)
						td.css('border-top-width', '0px');
					if(w==0)
						td.css('border-left-width', '0px');
					
					//x,y 좌표 설정/저장
					if(!bl) x++;
					if(!bt && w==0) y++;
					td.addClass('_nemo'+id+'y'+y).addClass('_nemo'+id+'x'+x);
					
					if(!bt && (h-config.heightMax)%5 == 0)
						td.css('border-top-width', '2px');
					if(!bl && (w-config.widthMax)%5 == 0)
						td.css('border-left-width', '2px');
					if(bt && bl)
						td.css('border-top-width', '0px')
						  .css('border-left-width', '0px');
					if(bt && h)
						td.css('border-top-width', '0px');
					if(bl && w)
						td.css('border-left-width', '0px');
					
					if(bt && !bl){
						if(dataArr.width[iw])
							td.text(dataArr.width[iw]);
						iw++;
					}else if(!bt && bl){
						if(dataArr.height[ih])
							td.text(dataArr.height[ih]);
						ih++;
					}else if(!bt && !bl){
						td.bind({
							'mousedown': function(event){
								if(event.which == 1 || event.which == 3){
									event.preventDefault();
									$.nemo.drag.id=$(this).data('id');
									//드래그 시작점/끝점 기록
									$.nemo.drag.start.x = $(this).data('x');
									$.nemo.drag.start.y = $(this).data('y');
									$.nemo.drag.end.x = $.nemo.drag.start.x;
									$.nemo.drag.end.y = $.nemo.drag.start.y;
									//드래그 종류 지정
									if((event.which == 1 && $(this).hasClass($.nemo.css.o)) ||
										(event.which == 3 && $(this).hasClass($.nemo.css.x)))
										$.nemo.drag.type = 0;
									else if(event.which == 1)
										$.nemo.drag.type = $.nemo.css.o;
									else if(event.which == 3)
										$.nemo.drag.type = $.nemo.css.x;
									//다시그리기
									$.nemo.redraw(id);
								}
							},
							/*'mouseup': function(event){
								event.preventDefault();
								//데이터 적용
								if($.nemo.drag.type == $.nemo.css.ot)
									$.nemo.fillData(id, $.nemo.css.o);
								else if($.nemo.drag.type == $.nemo.css.xt)
									$.nemo.fillData(id, $.nemo.css.x);
								//드래그 끝
								$.nemo.drag.id=0;
								//다시그리기
								$.nemo.redraw(id);
							},*/
							'mouseover': function(event){
								//event.preventDefault();
								$('._nemo'+$(this).data('id')).removeClass($.nemo.css.bgc);
								$('._nemo'+$(this).data('id')+'x'+$(this).data('x')).addClass($.nemo.css.bgc);
								$('._nemo'+$(this).data('id')+'y'+$(this).data('y')).addClass($.nemo.css.bgc);
								if($.nemo.drag.id){
									//끝점 기록
									$.nemo.drag.end.x = $(this).data('x');
									$.nemo.drag.end.y = $(this).data('y');
									//다시그리기
									$.nemo.redraw(id);
								}
							}//,
							//'mouseoout': function(event){
							//	$('._nemo'+$(this).data('id')+'x'+$(this).data('x')).removeClass($.nemo.css.bgc);
							//}
						}).data('idx', ii).data('x', x).data('y', y);
						config.tds[config.tds.length]=td;
						ii++;
					}
				}
			}
		},
		
		/**
		 * 네모로직 그리기용 틀 생성
		 */
		buildTableForDraw: function(id, options){
			var config = $.nemo.data[id];
			config.tds=[];
			$.extend(config, options);
			config.query = $.trim(config.query).replace(/ /g, '');
			if(config.width <= 0
			|| config.height <= 0
			|| !config.queryInputId){
				return;
			}
			
			//내부 데이타 초기화
			config.data = [];
			config.save = [];
			for(var i=0, size=config.width*config.height; i<size; i++){
				config.data[i] = 0;
				config.save[i] = 0;
			}
/*
			//왼쪽위쪽 숫자채우기
			var tempData = config.query.split(':');
			if(tempData.length != config.width + config.height)
				return;
			
			var dataArr = {width:[],height:[]};
			for(var i=0, size=config.width*config.heightMax; i<size; i++)
				dataArr.width[i] = 0;
			for(var i=0, size=config.height*config.widthMax; i<size; i++)
				dataArr.height[i] = 0;
			
			for(var i=0; i<tempData.length; i++){
				var a = tempData[i].split(',');
				if(a.length == 0) return;
				if(i<config.width){
					var x = i;
					for(var j=0; j<config.heightMax; j++){
						if(j >= a.length) break;
						var y=config.heightMax-j-1;
						dataArr.width[y*config.width+x] = a[a.length-1-j];
					}
				}else{
					var y = i-config.width;
					for(var j=0; j<config.widthMax; j++){
						if(j >= a.length) break;
						var x=config.widthMax-j-1;
						dataArr.height[y*config.widthMax+x] = a[a.length-1-j];
					}
				}
			}
*/			
			var obj = $('#'+config.tableId);
			obj.html('');
/*
			//도구
			var tools = $('<div>');//.appendTo(obj);
			var saveBtn = $('<button>')
				.text('임시저장')
				.attr('id', '_nemo'+id+'saveBtn')
				.attr('disabled','disabled')
				.data('id', id)
				.bind('click', function(){$.nemo.save($(this).data('id'));})
				.appendTo(tools);
			var loadBtn = $('<button>')
				.text('불러오기')
				.attr('id', '_nemo'+id+'loadBtn')
				.attr('disabled','disabled')
				.data('id', id)
				.bind('click', function(){$.nemo.load($(this).data('id'));})
				.appendTo(tools);
			//loadBtn.removeAttr('disabled');
*/
			//테이블 그리기
			var tableWidth = config.width;
			var tableHeight = config.height;
//			var nemoData = [];
			var table = $('<table>').addClass('_nemo_').attr('cellspacing','0').appendTo(obj);
			table.bind({
				'selectstart': function(event){
					event.preventDefault();
				}
//				'contextmenu': function(event){
//					event.preventDefault();
//				},
//				'mouseout' : function(event){
//					$('td._nemo_').removeClass($.nemo.css.bgc);
//				}
			});
			var ih=iw=ii=0;
			var y=-1;
			for(var h=0; h<tableHeight; h++){
				var tr = $('<tr>').addClass('_nemo_').appendTo(table);
				var x=-1;
				for(var w=0; w<tableWidth; w++){
					var td = $('<td>');
/*					var bl = (w<config.widthMax);
					var bt = (h<config.heightMax);
					if((h || w) && bt && bl)
						continue;
					else{
						if(h==0 && w==0){
							td.attr({
								rowspan: config.heightMax,
								colspan: config.widthMax,
								id: id+'_info'
							});
							tools.appendTo(td);
						}
*/						td.addClass('_nemo_')
							.addClass('_nemo'+id)
							.data('id', id)
							.appendTo(tr);
/*					}
					// 왼쪽/위쪽 라인 제거
					if(h==0)
						td.css('border-top-width', '0px');
					if(w==0)
						td.css('border-left-width', '0px');
					
					//x,y 좌표 설정/저장
					if(!bl) x++;
					if(!bt && w==0) y++;
					td.addClass('_nemo'+id+'y'+y).addClass('_nemo'+id+'x'+x);
					
					if(!bt && (h-config.heightMax)%5 == 0)
						td.css('border-top-width', '2px');
					if(!bl && (w-config.widthMax)%5 == 0)
						td.css('border-left-width', '2px');
					if(bt && bl)
						td.css('border-top-width', '0px')
						  .css('border-left-width', '0px');
					if(bt && h)
						td.css('border-top-width', '0px');
					if(bl && w)
						td.css('border-left-width', '0px');
					
					if(bt && !bl){
						if(dataArr.width[iw])
							td.text(dataArr.width[iw]);
						iw++;
					}else if(!bt && bl){
						if(dataArr.height[ih])
							td.text(dataArr.height[ih]);
						ih++;
					}else if(!bt && !bl){
						*/
						//x,y 좌표 설정/저장
						x++;
						if(w==0) y++;
						td.bind({
							'mousedown': function(event){
								if(event.which == 1 || event.which == 3){
									event.preventDefault();
									$.nemo.drag.id=id;
									//드래그 시작점/끝점 기록
									$.nemo.drag.start.x = $(this).data('x');
									$.nemo.drag.start.y = $(this).data('y');
									$.nemo.drag.end.x = $.nemo.drag.start.x;
									$.nemo.drag.end.y = $.nemo.drag.start.y;
									//드래그 종류 지정
									if((event.which == 1 && $(this).hasClass($.nemo.css.ot))
//										|| (event.which == 3 && $(this).hasClass($.nemo.css.x))
										)
										$.nemo.drag.type = 0;
									else if(event.which == 1)
										$.nemo.drag.type = $.nemo.css.ot;
									else if(event.which == 3)
										$.nemo.drag.type = 0;
									//다시그리기
									$.nemo.redraw($(this).data('id'));
								}
							},
							'mouseup': function(event){
								event.preventDefault();
								//var id=$(this).data('id');
								//데이터 적용
								$.nemo.fillData(id, $.nemo.drag.type);
								//드래그 끝
								$.nemo.drag.id=0;
								//query 계산
								$('#'+config.queryInputId).val($.nemo.checkQuery(id));
								//alert('#'+config.queryInputId);
							},
							'mouseover': function(event){
								//event.preventDefault();
								$('._nemo'+$(this).data('id')).removeClass($.nemo.css.bgc);
								$('._nemo'+$(this).data('id')+'x'+$(this).data('x')).addClass($.nemo.css.bgc);
								$('._nemo'+$(this).data('id')+'y'+$(this).data('y')).addClass($.nemo.css.bgc);
								if($.nemo.drag.id){
									//끝점 기록
									$.nemo.drag.end.x = $(this).data('x');
									$.nemo.drag.end.y = $(this).data('y');
									//다시그리기
									$.nemo.redraw($(this).data('id'));
								}
							}//,
							//'mouseoout': function(event){
							//	$('._nemo'+$(this).data('id')+'x'+$(this).data('x')).removeClass($.nemo.css.bgc);
							//}
						}).data('idx', ii).data('x', x).data('y', y);
						config.tds[config.tds.length]=td;
						ii++;
//					}
				}
			}
		},
		
		checkQuery: function(id){
			var w = $.nemo.data[id].width;
			var h = $.nemo.data[id].height;
			var data = $.nemo.data[id].data;
			var counting=0, now=0, zeroline=1;
			var result='';
			
			//아래에서 위로 탐색
			for(var x=0; x<w; x++){
				for(var y=h-1; y>=0; y--){
					var d = data[y*w+x];
					if(d == 0){
						if(counting){
							counting=0;
							if(result != '' && result[result.length-1] != ':')
								result += ',';
							result+=now;
							now=0;
						}
					}else{
						zeroline=0;
						if(counting){
							now+=1;
						}else{
							counting=1;
							now=1;
						}
					}
				}
				if(counting){
					counting=0;
					if(result != '' && result[result.length-1] != ':')
						result += ',';
					result+=now;
					now=0;
				}
				if(zeroline)
					result += 0;
				result += ':'
				zeroline=1;
			}
			
			//왼쪽에서 오른쪽으로 탐색
			for(var y=0; y<w; y++){
				for(var x=0; x<h; x++){
					var d = data[y*w+x];
					if(d == 0){
						if(counting){
							counting=0;
							if(result != '' && result[result.length-1] != ':')
								result += ',';
							result+=now;
							now=0;
						}
					}else{
						zeroline=0;
						if(counting){
							now+=1;
						}else{
							counting=1;
							now=1;
						}
					}
				}
				if(counting){
					counting=0;
					if(result != '' && result[result.length-1] != ':')
						result += ',';
					result+=now;
					now=0;
				}
				if(zeroline)
					result += 0;
				result += ':'
				zeroline=1;
			}

			//마지막 ':' 제거
			return result.substring(0,result.length-1);
		},
		
		/**
		 * 다시그리기(드래그중이나 끝난 후)
		 */
		redraw: function(id){
			var w = $.nemo.data[id].width;
			var h = $.nemo.data[id].height;
			var tds = $.nemo.data[id].tds;
			var data = $.nemo.data[id].data;
			var drag = $.nemo.drag;
			var x1=x2=y1=y2=-1;
			if(drag.id){
				x1=$.nemo.min(drag.start.x, drag.end.x);
				x2=$.nemo.max(drag.start.x, drag.end.x);
				y1=$.nemo.min(drag.start.y, drag.end.y);
				y2=$.nemo.max(drag.start.y, drag.end.y);
			}
			
			if(!tds || tds.length==0) return;
			if(tds.length != data.length){
				alert('tds.length(' + tds.length + ') != data.length(' + data.length + ')');
				return;
			}
			for(var y=0; y<h; y++){
				for(var x=0; x<w; x++){
					var i=y*w+x;
					if(drag.id && drag.id == id &&
						x >= x1 && x <= x2 &&
						y >= y1 && y <= y2){
						$.nemo.setTdClass(tds[i], drag.type);
					}else{
						$.nemo.setTdClass(tds[i], data[i]);
					}
				}
			}
		},
		
		fillData: function(id, type){
			var drag = $.nemo.drag;
			if(!drag.id) return;
			var data = $.nemo.data[id].data;
			var x1=$.nemo.min(drag.start.x, drag.end.x);
			var x2=$.nemo.max(drag.start.x, drag.end.x);
			var y1=$.nemo.min(drag.start.y, drag.end.y);
			var y2=$.nemo.max(drag.start.y, drag.end.y);
			
			for(var y=y1; y<=y2; y++){
				for(var x=x1; x<=x2; x++){
					data[y*$.nemo.data[id].width+x] = type;
				}
			}
			$.nemo.checkModify(id);
		},
		
		checkModify: function(id){
			$('#_nemo'+id+'saveBtn').removeAttr('disabled');
		},
		
		save: function(id){
			var data = $.nemo.data[id].data;
			var save = $.nemo.data[id].save;
			for(var i=0; i<data.length; i++)
				save[i] = data[i];
			$('#_nemo'+id+'saveBtn').attr('disabled', 'disabled');
			$('#_nemo'+id+'loadBtn').removeAttr('disabled');
		},
		
		load: function(id){
			var data = $.nemo.data[id].data;
			var save = $.nemo.data[id].save;
			for(var i=0; i<save.length; i++)
				data[i] = save[i];
			$.nemo.drag.id=0;
			$.nemo.redraw(id);
			$('#_nemo'+id+'saveBtn').attr('disabled', 'disabled');
		},
		
		setTdClass: function(td, type){
			switch(type){
				case $.nemo.css.o:
					if(!td.hasClass($.nemo.css.o))
						td.addClass($.nemo.css.o)
					if(td.hasClass($.nemo.css.x))
						td.removeClass($.nemo.css.x)
					if(td.hasClass($.nemo.css.ot))
						td.removeClass($.nemo.css.ot)
					if(td.hasClass($.nemo.css.xt))
						td.removeClass($.nemo.css.xt)
					break;
				case $.nemo.css.x:
					if(td.hasClass($.nemo.css.o))
						td.removeClass($.nemo.css.o)
					if(!td.hasClass($.nemo.css.x))
						td.addClass($.nemo.css.x)
					if(td.hasClass($.nemo.css.ot))
						td.removeClass($.nemo.css.ot)
					if(td.hasClass($.nemo.css.xt))
						td.removeClass($.nemo.css.xt)
					break;
				case $.nemo.css.ot:
					if(td.hasClass($.nemo.css.o))
						td.removeClass($.nemo.css.o)
					if(td.hasClass($.nemo.css.x))
						td.removeClass($.nemo.css.x)
					if(!td.hasClass($.nemo.css.ot))
						td.addClass($.nemo.css.ot)
					if(td.hasClass($.nemo.css.xt))
						td.removeClass($.nemo.css.xt)
					break;
				case $.nemo.css.xt:
					if(td.hasClass($.nemo.css.o))
						td.removeClass($.nemo.css.o)
					if(td.hasClass($.nemo.css.x))
						td.removeClass($.nemo.css.x)
					if(td.hasClass($.nemo.css.ot))
						td.removeClass($.nemo.css.ot)
					if(!td.hasClass($.nemo.css.xt))
						td.addClass($.nemo.css.xt)
					break;
				default:
						td.removeClass($.nemo.css.o)
						td.removeClass($.nemo.css.x)
						td.removeClass($.nemo.css.ot)
						td.removeClass($.nemo.css.xt)
			}
		}
	});
	
	$('html').bind({
		'mouseup': function(event){
			var id=$.nemo.drag.id;
			if(id){
				//데이터 적용
				$.nemo.fillData(id, $.nemo.drag.type);
				//드래그 끝
				$.nemo.drag.id=0;
				//다시그리기
				$.nemo.redraw(id);
			}
		}
	});
})(jQuery);

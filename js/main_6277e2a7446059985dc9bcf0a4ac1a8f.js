var z_index_window = 1,
     arr_locks = [],
	   months = {'january':31, 'february':28, 'march':31, 'april':30, 'may':31, 'june':30, 'july':31, 'august':31, ' september':30, 'october':31, 'november':30, 'december':31},
		 all_reminds = {},
     remind_conf = {'id':0, 'type':'', 'message':''};

// function preventing accidental double click of the mouse
function lock(act, variable){
	switch(act){
		case 'check':
			return ~arr_locks.indexOf(variable);
		break;
		case 'add':
			arr_locks.push(variable);
		break;
		case 'delete':
			var len = arr_locks.length;
			for(var i = 0;i < len; i++){
				if(arr_locks[i] == variable){
					if(i + 1 == len){
						arr_locks.pop()
					}else{
						arr_locks.splice(i,1)
					}
					break;
				}
			}
		break;
	}
}

// function to animate data loading to the server
function show_animation_load(width, height, color){
	color = color.replace('#', '');
	return '<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+'" viewBox="0 0 100 100"><circle cx="84" cy="50" r="10" fill="#'+color+'">    <animate attributeName="r" repeatCount="indefinite" dur="0.25s" calcMode="spline" keyTimes="0;1" values="10;0" keySplines="0 0.5 0.5 1" begin="0s"></animate>    <animate attributeName="fill" repeatCount="indefinite" dur="1s" calcMode="discrete" keyTimes="0;0.25;0.5;0.75;1" values="#'+color+';#'+color+';#'+color+';#'+color+';#'+color+'" begin="0s"></animate></circle><circle cx="16" cy="50" r="10" fill="#'+color+'">  <animate attributeName="r" repeatCount="indefinite" dur="1s" calcMode="spline" keyTimes="0;0.25;0.5;0.75;1" values="0;0;10;10;10" keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1" begin="0s"></animate>  <animate attributeName="cx" repeatCount="indefinite" dur="1s" calcMode="spline" keyTimes="0;0.25;0.5;0.75;1" values="16;16;16;50;84" keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1" begin="0s"></animate></circle><circle cx="50" cy="50" r="10" fill="#'+color+'">  <animate attributeName="r" repeatCount="indefinite" dur="1s" calcMode="spline" keyTimes="0;0.25;0.5;0.75;1" values="0;0;10;10;10" keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1" begin="-0.25s"></animate>  <animate attributeName="cx" repeatCount="indefinite" dur="1s" calcMode="spline" keyTimes="0;0.25;0.5;0.75;1" values="16;16;16;50;84" keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1" begin="-0.25s"></animate></circle><circle cx="84" cy="50" r="10" fill="#'+color+'">  <animate attributeName="r" repeatCount="indefinite" dur="1s" calcMode="spline" keyTimes="0;0.25;0.5;0.75;1" values="0;0;10;10;10" keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1" begin="-0.5s"></animate>  <animate attributeName="cx" repeatCount="indefinite" dur="1s" calcMode="spline" keyTimes="0;0.25;0.5;0.75;1" values="16;16;16;50;84" keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1" begin="-0.5s"></animate></circle><circle cx="16" cy="50" r="10" fill="#'+color+'">  <animate attributeName="r" repeatCount="indefinite" dur="1s" calcMode="spline" keyTimes="0;0.25;0.5;0.75;1" values="0;0;10;10;10" keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1" begin="-0.75s"></animate>  <animate attributeName="cx" repeatCount="indefinite" dur="1s" calcMode="spline" keyTimes="0;0.25;0.5;0.75;1" values="16;16;16;50;84" keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1" begin="-0.75s"></animate></circle></svg>';
}

async function get_lang_json(){
	var fetch_err_text = '';
	var controller = new AbortController();
	var timeout = setTimeout((controller) => controller.abort(), 5000, controller);
	try {
		var response = await fetch('/get_lang_json', {
			signal: controller.signal,
			method: 'GET'
		});
	} catch (err) {
		fetch_err_text = err;
	}
	clearTimeout(timeout);
	if (fetch_err_text === '') {
		if (response.ok) {
			try {
				var result = await response.text();
				result = JSON.parse(result);
				lang_obj = result.response;
			} catch (err) {
				get_error_window('open', err);
			}
		}else{
			get_error_window('open', response.statusText);
		}
	}else{
		get_error_window('open', fetch_err_text);
	}
}

function send_ajax(url, payload, options){
	var interval = null;
	var contentType = 'application/x-www-form-urlencoded';
	var timeout = 29000;
	var co = 0;
	var data = '';
	if(payload && typeof(payload) == 'object' && Object.keys(payload).length > 0){
		data = JSON.stringify(payload);
		contentType = 'application/json';
	}
	var jqxhr = $.ajax({
		type: options.method,
		url: url,
		data: data,
		timeout: timeout,
		contentType: contentType,
		cache: false,
		headers: options.headers,
		error: function(jqXHR, textStatus, errorThrown){
			if(errorThrown == 'timeout'){
				if(interval !== null){
					clearInterval(interval);
				}
				if(options.no_response_callback){
					options.no_response_callback()
				}
				get_error_window('open', convert_lang('the server is not responding')+' (timeout)');
				jqxhr = null;
				data = null;
			}
		}
	});
	var interval = setInterval(function() {
		if (jqxhr.readyState == 4) {
			clearInterval(interval);
			if(options.response_callback){
				options.response_callback(jqxhr.responseText, options.is_json_response);
			}
			data = null;
			return;
		}
		co++;
		if((co * 100) > timeout){
			clearInterval(interval);
			if(options.no_response_callback){
				options.no_response_callback()
			}
			get_error_window('open', convert_lang('the server is not responding')+' (timeout)');
			jqxhr = null;
			data = null;
		}
	}, 100);
}

function get_error_window(act, data){
	var elem = $('.error_window');
	if(act == 'open'){
		var is_hidden = elem.hasClass('hidden');
		if(is_hidden){
			elem.css('z-index', z_index_window);
			elem.removeClass('hidden');
			elem.animate({opacity: 1}, 100, function(){
				control_resize_all_window()
			});
			get_dark_background(act);
			z_index_window++;
		}
		if(typeof(data) == 'string' && data !== ''){
			data = data.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
			$('.content_error_window').html(data);
		}
		$('.header_error_window > span').html(convert_lang('ERROR'));
	}else{
		elem.animate({opacity: 0}, 100, function(){
			var e = $(this);
			e.addClass('hidden');
			e.css('margin', '');
		});
		get_dark_background(act);
	}
}

function result__(result_){
	var result = {};
	try{
		result = JSON.parse(result_);
	}catch(e){
		get_error_window('open', e.message + ' \n ---------------------------------------------------- \n ' + String(result_));
		result = null;
	}
	return result;
}

function response__save_timezone(result_){
	var result = result__(result_);
	if(result == null){return;}
	if (result.response) {
		setTimeout((function(){ // make a delay of 1 second while icon_animate_load_page blinks
			get_reminds();
		}), 500);
		return;
	}
	if(result.error !== ''){
		get_error_window('open', result.error);
	}else{
		get_error_window('open', result_);
	}
}

function save_timezone(){
	var payload = {'user_id':tg_obj.initDataUnsafe.user.id, 'timezone':String(-(new Date().getTimezoneOffset() / 60))};
	var options = {
		'method': 'POST',
		'response_callback': response__save_timezone
	};
	send_ajax('/save_timezone', payload, options);
}

function insert_item_remind(data, way_insert){
	var fragment = document.createDocumentFragment();
	for(var item of data){
		var info_item_reminder = '<div class="type_item_reminder w-fit flex items-center justify-center"><span>'+convert_lang(item.conf.type)+'</span></div>';
		all_reminds[item.id] = item.conf;
		switch(item.conf.type){
			case 'each hour':
				var minute = item.conf.minute;
				if(minute < 10){
					minute = '0'+String(minute);
				}
				minute = '**:'+minute;
				info_item_reminder += '<div class="time_item_reminder w-fit flex items-center justify-center"><span>'+minute+'</span></div>';
				break;
			case 'every few hours':
				var minute = item.conf.minute;					
				var interval = convert_lang('interval')+': '+item.conf.interval+' '+decline(item.conf.interval, convert_lang('hour'), convert_lang('hours'), convert_lang('hours2'));
				if(minute < 10){
					minute = '0'+String(minute);
				}
				minute = '**:'+minute;
				info_item_reminder += '<div class="time_item_reminder w-fit flex items-center justify-center"><span>'+minute+'</span></div><div class="interval_item_reminder w-fit flex items-center justify-center"><span>'+interval+'</span></div>';
				break;
			case 'at a certain hour':
				var minute = item.conf.minute;
				var hour = item.conf.hour;
				if(minute < 10){
					minute = '0'+String(minute);
				}
				if(hour < 10){
					hour = '0'+String(hour);
				}
				info_item_reminder += '<div class="time_item_reminder w-fit flex items-center justify-center"><span>'+hour+':'+minute+'</span></div>';
				break;
			case 'every few days':
				var minute = item.conf.minute;
				var hour = item.conf.hour;
				var interval = convert_lang('interval')+': '+item.conf.interval+' '+decline(item.conf.interval, convert_lang('day'), convert_lang('days'), convert_lang('days2'));
				if(minute < 10){
					minute = '0'+String(minute);
				}
				if(hour < 10){
					hour = '0'+String(hour);
				}
				info_item_reminder += '<div class="time_item_reminder w-fit flex items-center justify-center"><span>'+hour+':'+minute+'</span></div><div class="interval_item_reminder w-fit flex items-center justify-center"><span>'+interval+'</span></div>';
				break;
			case 'at a certain day':
				var minute = item.conf.minute;
				var hour = item.conf.hour;
				if(minute < 10){
					minute = '0'+String(minute);
				}
				if(hour < 10){
					hour = '0'+String(hour);
				}
				info_item_reminder += '<div class="day_item_reminder w-fit flex items-center justify-center"><span>'+convert_lang(item.conf.day)+'</span></div><div class="time_item_reminder w-fit flex items-center justify-center"><span>'+hour+':'+minute+'</span></div>';
				break;
			case 'on a certain date':
				var minute = item.conf.minute;
				var hour = item.conf.hour;
				if(minute < 10){
					minute = '0'+String(minute);
				}
				if(hour < 10){
					hour = '0'+String(hour);
				}
				info_item_reminder += '<div class="number_item_reminder w-fit flex items-center justify-center"><span>'+item.conf.number+'</span></div><div class="time_item_reminder w-fit flex items-center justify-center"><span>'+hour+':'+minute+'</span></div>';
				break;
			case 'in a certain month':
				var minute = item.conf.minute;
				var hour = item.conf.hour;
				if(minute < 10){
					minute = '0'+String(minute);
				}
				if(hour < 10){
					hour = '0'+String(hour);
				}
				info_item_reminder += '<div class="number_item_reminder w-fit flex items-center justify-center"><span>'+item.conf.number+'</span></div><div class="month_item_reminder w-fit flex items-center justify-center"><span>'+convert_lang(item.conf.month)+'</span></div><div class="time_item_reminder w-fit flex items-center justify-center"><span>'+hour+':'+minute+'</span></div>';
				break;
			case 'every few months':
				var minute = item.conf.minute;
				var hour = item.conf.hour;
				var interval = convert_lang('interval')+': '+item.conf.interval+' '+decline(item.conf.interval, convert_lang('month'), convert_lang('months'), convert_lang('months2'));
				if(minute < 10){
					minute = '0'+String(minute);
				}
				if(hour < 10){
					hour = '0'+String(hour);
				}
				info_item_reminder += '<div class="number_item_reminder w-fit flex items-center justify-center"><span>'+item.conf.number+'</span></div><div class="time_item_reminder w-fit flex items-center justify-center"><span>'+hour+':'+minute+'</span></div><div class="interval_item_reminder w-fit flex items-center justify-center"><span>'+interval+'</span></div>';
				break;
			case 'specific date (once)':
				var minute = item.conf.minute;
				var hour = item.conf.hour;
				if(minute < 10){
					minute = '0'+String(minute);
				}
				if(hour < 10){
					hour = '0'+String(hour);
				}
				info_item_reminder += '<div class="number_item_reminder w-fit flex items-center justify-center"><span>'+item.conf.number+'</span></div><div class="month_item_reminder w-fit flex items-center justify-center"><span>'+convert_lang(item.conf.month)+'</span></div><div class="time_item_reminder w-fit flex items-center justify-center"><span>'+hour+':'+minute+'</span></div>';
				break;
		}
		var message = item.conf.message.replace(/\n/g, '<br>');
		if(way_insert == 'append' || way_insert == 'prepend'){
			var e = document.createElement('div');
			e.setAttribute('class', 'item_reminder_'+item.id+' item_reminder w-full');
			if(way_insert == 'prepend'){
				e.setAttribute('style', 'border: 0.1em solid #93cd8f;');
			}
			e.innerHTML = '<div class="header_item_reminder flex items-center justify-between"><span># '+item.id+'</span><div class="flex items-center justify-between"><i class="icon_edit_item_reminder cursor-pointer" onclick="get_new_or_edit_remind_window(\'open\', \'edit\', '+item.id+')"></i><i class="icon_delete_item_reminder cursor-pointer" onclick="get_confirm_delete_remind_window(\'open\', '+item.id+')"></i></div></div><div class="text_item_reminder layout-cell layout-scrollbar"><span>'+message+'</span></div><div class="info_item_reminder flex flex-wrap">'+info_item_reminder+'</div>';
			fragment.append(e);
		}
		if(way_insert == 'replace'){
			$('.item_reminder_'+item.id).css('border', '0.1em solid #93cd8f');
			$('.item_reminder_'+item.id+' div.text_item_reminder > span').html(message);
			$('.item_reminder_'+item.id+' div.info_item_reminder').html(info_item_reminder);
			setTimeout((function(id){
				$('.item_reminder_'+id).css('border', '');
			}), 2000, item.id);
		}
	}
	var elem = $('.all_reminders_block');
	if(way_insert == 'append'){
		elem.html('');
		elem.append(fragment);
	}
	if(way_insert == 'prepend'){
		if($('.all_reminders_block div.text_no_reminders').length > 0){
			elem.removeClass('justify-center');
			elem.html('');
		}
		elem.prepend(fragment);
		setTimeout((function(id){
			$('.item_reminder_'+id).css('border', '');
		}), 2000, data[0].id);
	}
	if(way_insert != 'replace'){
		$('.block_add_new_remind_').html('<div class="block_add_new_remind overflow-hidden relative"><i class="icon_add_new_remind absolute cursor-pointer" style="top:0.5em;" onclick="get_new_or_edit_remind_window(\'open\', \'new\')"></i></div>');
	}
}

function response__get_reminds(result_){
	$('.icon_animate_load_page').addClass('hidden');
	var result = result__(result_);
	if(result == null){return;}
	if (result.response) {
		var elem = $('.all_reminders_block');
		if(result.response.length == 0){
			elem.addClass('justify-center');
			elem.html('<div class="text_no_reminders flex items-center"><span>'+convert_lang('No reminders')+'</span></div><div class="block_add_new_remind overflow-hidden relative"><i class="icon_add_new_remind absolute cursor-pointer" style="top:-2.5em;" onclick="get_new_or_edit_remind_window(\'open\', \'new\')"></i></div>');
			setTimeout((function(){
				$('.icon_add_new_remind').animate({top: '0.5em'}, 150, function(){
					$(this).animate({top: '0em'}, 50, function(){
						$(this).animate({top: '0.5em'}, 50);
					});
				});
			}), 1000);
			return;
		}
		insert_item_remind(result.response, 'append');
		return;
	}
	if(result.error !== ''){
		get_error_window('open', result.error);
	}else{
		get_error_window('open', result_);
	}
}

function no_response__get_reminds(){
	$('.icon_animate_load_page').addClass('hidden');
}

function get_reminds(){
	var options = {
		'method': 'GET',
		'response_callback': response__get_reminds,
		'no_response_callback': no_response__get_reminds
	};
	send_ajax('/get_reminds?user_id='+tg_obj.initDataUnsafe.user.id, null, options);
}

function convert_lang(data){
	if(lang_obj[data]){
		return lang_obj[data];
	}
	return data;
}

// function for correct substitution of words, for example it will write "23 hours" and not "23 hous". The word "hour" will be substituted correctly
function decline(a, b, c, d) {
	var r;
	a = a + '';
	var n1 = a.substr(-1, 1);
	var n2 = a.substr(-2, 1);
	if ((n1 == '1' && n2 + n1 != '11') || (a == '1')) {
			r = b;
	} else if ((n1 == '2' || n1 == '3' || n1 == '4') && (n2 != '1')) {
			r = c;
	} else {
			r = d;
	}
	return r;
}

function get_act_interval(){
	var act_interval;
	switch($('.type_new_remind').attr('data-type')){
		case 'every few hours':
			act_interval = 'hour';
			break;
		case 'every few days':
			act_interval = 'day';
			break;
		case 'every few months':
			act_interval = 'month';
			break;
	}
	return act_interval;
}
			
function get_new_or_edit_remind_window(act, act2, id){
	var elem = $('.add_or_edit_remind_window');
	if(act == 'open'){
		var is_hidden = elem.hasClass('hidden');
		if(is_hidden){
			elem.css('z-index', z_index_window);
			elem.removeClass('hidden');
			elem.animate({opacity: 1}, 100, function(){
				control_resize_all_window()
			});
			get_dark_background(act);
			z_index_window++;
		}
		var e = $('.header_add_or_edit_remind_window > span');
		e.attr('data', act2);
		e.html(convert_lang(act2 == 'new' ? 'NEW REMINDER' : 'EDIT REMIND'));
		$('.header_text_new_remind > span').html(convert_lang('Text'));
		$('.header_type_new_remind > span').html(convert_lang('Type'));
		$('.content_add_or_edit_remind_window > div.block_button').html('<button class="bt_save_remind button flex items-center justify-center" onclick="save_remind()" data="'+convert_lang('Save')+'">'+convert_lang('Save')+'</button>');
		if(act2 == 'new'){
			remind_conf['id'] = 0;
		}
		if(act2 == 'edit'){
			var message = $('.item_reminder_'+id+' div.text_item_reminder > span').html();
			message = message.replace(/<br>/g, '\n').replace(/&#092;/g, '\\').replace(/&#96;/g, '`').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
			show_textarea_new_remind('.text_new_remind');
			$('.input_text_new_remind').val(message);
			remind_conf['message'] = message;
			remind_conf['type'] = all_reminds[id].type;
			remind_conf['minute'] = all_reminds[id].minute;
			remind_conf['hour'] = all_reminds[id].hour;
			remind_conf['interval'] = all_reminds[id].interval;
			remind_conf['month'] = all_reminds[id].month;
			remind_conf['day'] = all_reminds[id].day;
			remind_conf['number'] = all_reminds[id].number;
			remind_conf['id'] = id;
			show_select_type_new_remind('.type_new_remind', true);
			var e = $('.content_add_or_edit_remind_window div.type_new_remind');
			e.html('');
			e.attr('data-type', all_reminds[id].type);
			var e = $('.item_reminder_'+id+' div.info_item_reminder div.type_item_reminder').clone().appendTo('.content_add_or_edit_remind_window div.type_new_remind');
			e.addClass('cursor-pointer');
			e.attr('onclick', 'get_type_remind_window(\'open\')');
			var elem = $('.block_select_next_new_remind');
			elem.removeClass('hidden');
			elem.html(get_next_form_new_remind(all_reminds[id].type));
			switch(all_reminds[id].type){
				case 'each hour':
					show_select_minute_new_remind('.minute_new_remind', true);
					var e = $('.content_add_or_edit_remind_window div.minute_new_remind');
					e.html('');
					e.attr('data', '1');
					var e = $('.item_reminder_'+id+' div.info_item_reminder div.time_item_reminder').clone().appendTo('.content_add_or_edit_remind_window div.minute_new_remind');
					e.addClass('cursor-pointer');
					e.attr('onclick', 'get_minute_remind_window(\'open\')');
					break;
				case 'every few hours':
					show_select_minute_new_remind('.minute_new_remind', true);
					var e = $('.content_add_or_edit_remind_window div.minute_new_remind');
					e.html('');
					e.attr('data', '1');
					var e = $('.item_reminder_'+id+' div.info_item_reminder div.time_item_reminder').clone().appendTo('.content_add_or_edit_remind_window div.minute_new_remind');
					e.addClass('cursor-pointer');
					e.attr('onclick', 'get_minute_remind_window(\'open\')');
					show_select_interval_new_remind('.interval_new_remind', true);
					var e = $('.content_add_or_edit_remind_window div.interval_new_remind');
					e.html('');
					e.attr('data', '1');
					var e = $('.item_reminder_'+id+' div.info_item_reminder div.interval_item_reminder').clone().appendTo('.content_add_or_edit_remind_window div.interval_new_remind');
					e.addClass('cursor-pointer');
					e.attr('onclick', 'get_interval_remind_window(\'open\')');
					break;
				case 'at a certain hour':
					show_select_hour_and_minute_new_remind('.hour_and_minute_new_remind', true);
					var e = $('.content_add_or_edit_remind_window div.hour_and_minute_new_remind');
					e.html('');
					e.attr('data', '1');
					var e = $('.item_reminder_'+id+' div.info_item_reminder div.time_item_reminder').clone().appendTo('.content_add_or_edit_remind_window div.hour_and_minute_new_remind');
					e.addClass('cursor-pointer');
					e.attr('onclick', 'get_hour_and_minute_remind_window(\'open\')');
					break;
				case 'every few days':
					show_select_hour_and_minute_new_remind('.hour_and_minute_new_remind', true);
					var e = $('.content_add_or_edit_remind_window div.hour_and_minute_new_remind');
					e.html('');
					e.attr('data', '1');
					var e = $('.item_reminder_'+id+' div.info_item_reminder div.time_item_reminder').clone().appendTo('.content_add_or_edit_remind_window div.hour_and_minute_new_remind');
					e.addClass('cursor-pointer');
					e.attr('onclick', 'get_hour_and_minute_remind_window(\'open\')');
					show_select_interval_new_remind('.interval_new_remind', true);
					var e = $('.content_add_or_edit_remind_window div.interval_new_remind');
					e.html('');
					e.attr('data', '1');
					var e = $('.item_reminder_'+id+' div.info_item_reminder div.interval_item_reminder').clone().appendTo('.content_add_or_edit_remind_window div.interval_new_remind');
					e.addClass('cursor-pointer');
					e.attr('onclick', 'get_interval_remind_window(\'open\')');
					break;
				case 'at a certain day':
					show_select_hour_and_minute_new_remind('.hour_and_minute_new_remind', true);
					var e = $('.content_add_or_edit_remind_window div.hour_and_minute_new_remind');
					e.html('');
					e.attr('data', '1');
					var e = $('.item_reminder_'+id+' div.info_item_reminder div.time_item_reminder').clone().appendTo('.content_add_or_edit_remind_window div.hour_and_minute_new_remind');
					e.addClass('cursor-pointer');
					e.attr('onclick', 'get_hour_and_minute_remind_window(\'open\')');
					show_select_day_new_remind('.day_new_remind', true);
					var e = $('.content_add_or_edit_remind_window div.day_new_remind');
					e.html('');
					e.attr('data', '1');
					var e = $('.item_reminder_'+id+' div.info_item_reminder div.day_item_reminder').clone().appendTo('.content_add_or_edit_remind_window div.day_new_remind');
					e.addClass('cursor-pointer');
					e.attr('onclick', 'get_day_remind_window(\'open\')');
					break;
				case 'on a certain date':
					show_select_hour_and_minute_new_remind('.hour_and_minute_new_remind', true);
					var e = $('.content_add_or_edit_remind_window div.hour_and_minute_new_remind');
					e.html('');
					e.attr('data', '1');
					var e = $('.item_reminder_'+id+' div.info_item_reminder div.time_item_reminder').clone().appendTo('.content_add_or_edit_remind_window div.hour_and_minute_new_remind');
					e.addClass('cursor-pointer');
					e.attr('onclick', 'get_hour_and_minute_remind_window(\'open\')');
					show_select_number_new_remind('.number_new_remind', true);
					var e = $('.content_add_or_edit_remind_window div.number_new_remind');
					e.html('');
					e.attr('data', '1');
					var e = $('.item_reminder_'+id+' div.info_item_reminder div.number_item_reminder').clone().appendTo('.content_add_or_edit_remind_window div.number_new_remind');
					e.addClass('cursor-pointer');
					e.attr('onclick', 'get_number_remind_window(\'open\')');
					break;
				case 'in a certain month':
					show_select_hour_and_minute_new_remind('.hour_and_minute_new_remind', true);
					var e = $('.content_add_or_edit_remind_window div.hour_and_minute_new_remind');
					e.html('');
					e.attr('data', '1');
					var e = $('.item_reminder_'+id+' div.info_item_reminder div.time_item_reminder').clone().appendTo('.content_add_or_edit_remind_window div.hour_and_minute_new_remind');
					e.addClass('cursor-pointer');
					e.attr('onclick', 'get_hour_and_minute_remind_window(\'open\')');
					show_select_number_new_remind('.number_new_remind', true);
					var e = $('.content_add_or_edit_remind_window div.number_new_remind');
					e.html('');
					e.attr('data', '1');
					var e = $('.item_reminder_'+id+' div.info_item_reminder div.number_item_reminder').clone().appendTo('.content_add_or_edit_remind_window div.number_new_remind');
					e.addClass('cursor-pointer');
					e.attr('onclick', 'get_number_remind_window(\'open\')');
					show_select_month_new_remind('.month_new_remind', true);
					var e = $('.content_add_or_edit_remind_window div.month_new_remind');
					e.html('');
					e.attr('data', '1');
					var e = $('.item_reminder_'+id+' div.info_item_reminder div.month_item_reminder').clone().appendTo('.content_add_or_edit_remind_window div.month_new_remind');
					e.addClass('cursor-pointer');
					e.attr('onclick', 'get_month_remind_window(\'open\')');
					break;
				case 'every few months':
					show_select_hour_and_minute_new_remind('.hour_and_minute_new_remind', true);
					var e = $('.content_add_or_edit_remind_window div.hour_and_minute_new_remind');
					e.html('');
					e.attr('data', '1');
					var e = $('.item_reminder_'+id+' div.info_item_reminder div.time_item_reminder').clone().appendTo('.content_add_or_edit_remind_window div.hour_and_minute_new_remind');
					e.addClass('cursor-pointer');
					e.attr('onclick', 'get_hour_and_minute_remind_window(\'open\')');
					show_select_number_new_remind('.number_new_remind', true);
					var e = $('.content_add_or_edit_remind_window div.number_new_remind');
					e.html('');
					e.attr('data', '1');
					var e = $('.item_reminder_'+id+' div.info_item_reminder div.number_item_reminder').clone().appendTo('.content_add_or_edit_remind_window div.number_new_remind');
					e.addClass('cursor-pointer');
					e.attr('onclick', 'get_number_remind_window(\'open\')');
					show_select_interval_new_remind('.interval_new_remind', true);
					var e = $('.content_add_or_edit_remind_window div.interval_new_remind');
					e.html('');
					e.attr('data', '1');
					var e = $('.item_reminder_'+id+' div.info_item_reminder div.interval_item_reminder').clone().appendTo('.content_add_or_edit_remind_window div.interval_new_remind');
					e.addClass('cursor-pointer');
					e.attr('onclick', 'get_interval_remind_window(\'open\')');			
					break;
				case 'specific date (once)':
					show_select_hour_and_minute_new_remind('.hour_and_minute_new_remind', true);
					var e = $('.content_add_or_edit_remind_window div.hour_and_minute_new_remind');
					e.html('');
					e.attr('data', '1');
					var e = $('.item_reminder_'+id+' div.info_item_reminder div.time_item_reminder').clone().appendTo('.content_add_or_edit_remind_window div.hour_and_minute_new_remind');
					e.addClass('cursor-pointer');
					e.attr('onclick', 'get_hour_and_minute_remind_window(\'open\')');
					show_select_number_new_remind('.number_new_remind', true);
					var e = $('.content_add_or_edit_remind_window div.number_new_remind');
					e.html('');
					e.attr('data', '1');
					var e = $('.item_reminder_'+id+' div.info_item_reminder div.number_item_reminder').clone().appendTo('.content_add_or_edit_remind_window div.number_new_remind');
					e.addClass('cursor-pointer');
					e.attr('onclick', 'get_number_remind_window(\'open\')');
					show_select_month_new_remind('.month_new_remind', true);
					var e = $('.content_add_or_edit_remind_window div.month_new_remind');
					e.html('');
					e.attr('data', '1');
					var e = $('.item_reminder_'+id+' div.info_item_reminder div.month_item_reminder').clone().appendTo('.content_add_or_edit_remind_window div.month_new_remind');
					e.addClass('cursor-pointer');
					e.attr('onclick', 'get_month_remind_window(\'open\')');
					break;
			}
		}
	}else{
		elem.animate({opacity: 0}, 100, function(){
			var e = $(this);
			e.addClass('hidden');
			e.css('margin', '');
		});
		get_dark_background(act);
	}
}

function get_dark_background(act){
	var elem = $('.dark_background');
	if(act == 'open'){
		elem.removeClass('hidden');
		elem.animate({opacity: 1}, 100);
	}else{
		var elems = $('.window_');
		var co = 0;
		for(var item of elems){
			if(!$(item).hasClass('hidden')){
				co++;
			}
		}
		if(co == 1){
			elem.animate({opacity: 0}, 100, function(){
				$(this).addClass('hidden');
			});
		}
	}
}

function show_textarea_new_remind(selector){
	var elem = $(selector);
	if(elem.attr('data-is_show') == ''){
		elem.attr('data-is_show', '1');
		var elem = $('.header_text_new_remind > span');
		elem.css('top', '0').css('left', '0');
		elem.addClass('is_selected_color');
		$('.header_text_new_remind').css('height', '1.5em');
		$('.text_new_remind').css('height', 'unset');
		var elem = $('.input_text_new_remind');
		elem.removeClass('hidden');
		elem.addClass('show_input_text_new_remind');
		setTimeout((function(){
			elem.focus();
		}), 200);
	}
}

function show_select_type_new_remind(selector, is_no_open_window = false){
	var elem = $(selector);
	if(elem.attr('data-is_show') == ''){
		elem.attr('data-is_show', '1');
		elem.html('<div class="type_item_reminder w-fit flex items-center justify-center cursor-pointer" onclick="get_type_remind_window(\'open\')"><span>'+convert_lang('not chosen')+'</span></div>');
		var elem = $('.header_type_new_remind > span');
		elem.css('top', '0').css('left', '0');
		elem.addClass('is_selected_color');
		$('.header_type_new_remind').css('height', '1.5em');
		if(is_no_open_window === false){
			get_type_remind_window('open');
		}
	}
}

function get_type_remind_window(act){
	var elem = $('.type_remind_window');
	if(act == 'open'){
		var is_hidden = elem.hasClass('hidden');
		if(is_hidden){
			elem.css('z-index', z_index_window);
			elem.removeClass('hidden');
			elem.animate({opacity: 1}, 100, function(){
				control_resize_all_window()
			});
			get_dark_background(act);
			z_index_window++;
		}
		$('.header_type_remind_window > span').html(convert_lang('TYPES OF REMINDERS'));
		$('div[data="each hour"] > span').html(convert_lang('each hour'));		
		$('div[data="every few hours"] > span').html(convert_lang('every few hours'));
		$('div[data="at a certain hour"] > span').html(convert_lang('at a certain hour'));
		$('div[data="every few days"] > span').html(convert_lang('every few days'));
		$('div[data="at a certain day"] > span').html(convert_lang('at a certain day'));
		$('div[data="on a certain date"] > span').html(convert_lang('on a certain date'));
		$('div[data="in a certain month"] > span').html(convert_lang('in a certain month'));
		$('div[data="every few months"] > span').html(convert_lang('every few months'));
		$('div[data="specific date (once)"] > span').html(convert_lang('specific date (once)'));
	}else{
		elem.animate({opacity: 0}, 100, function(){
			var e = $(this);
			e.addClass('hidden');
			e.css('margin', '');
		});
		get_dark_background(act);
	}
}

function select_month_remind(elem){
	var month = $(elem).attr('data');
	$('.option_month_remind > i').addClass('radio_no_select').removeClass('radio_select');
	$('div[data="'+month+'"] > i').addClass('radio_select');
	$('.month_new_remind > div.month_item_reminder span').html(convert_lang(month));
	var max_number = months[month];
	if($('.number_new_remind div.number_item_reminder > span').length > 0){
		var number = $('.number_new_remind div.number_item_reminder > span').html().replace(/[^0-9]/g, '');
		if(number !== '' && +number > max_number){
			$('.number_new_remind div.number_item_reminder > span').html(max_number);
			remind_conf['number'] = +number;
		}
	}
	var elem = $('.month_new_remind');
	elem.attr('data', month);
	elem.removeClass('is_error_color');
	$(elem[0].previousElementSibling.firstElementChild).css('color', '');
	setTimeout((function(){
		get_month_remind_window('close');
	}), 150);
	remind_conf['month'] = month;
}

function select_day_remind(elem){
	var day = $(elem).attr('data');
	$('.option_day_remind > i').addClass('radio_no_select').removeClass('radio_select');
	$('div[data="'+day+'"] > i').addClass('radio_select');
	$('.day_new_remind > div.day_item_reminder span').html(convert_lang(day));
	var elem = $('.day_new_remind');
	elem.attr('data', day);
	elem.removeClass('is_error_color');
	$(elem[0].previousElementSibling.firstElementChild).css('color', '');
	setTimeout((function(){
		get_day_remind_window('close');
	}), 150);
	remind_conf['day'] = day;
}

function select_type_remind(elem){
	var type = $(elem).attr('data');
	$('.option_type_remind > i').addClass('radio_no_select').removeClass('radio_select');
	$('div[data="'+type+'"] > i').addClass('radio_select');
	$('.type_new_remind > div.type_item_reminder span').html(convert_lang(type));
	var elem = $('.type_new_remind');
	elem.attr('data-type', type);
	elem.removeClass('is_error_color');
	$(elem[0].previousElementSibling.firstElementChild).css('color', '');
	setTimeout((function(){
		get_type_remind_window('close');
		var elem = $('.block_select_next_new_remind');
		elem.removeClass('hidden');
		elem.html(get_next_form_new_remind(type));
	}), 150);
	remind_conf['type'] = type;
}

function get_next_form_new_remind(type){
	var form = '';
	switch(type){
		case 'each hour':
			form = '<div class="header_minute_new_remind relative"><span class="absolute cursor-default" onclick="show_select_minute_new_remind(\'.minute_new_remind\')">'+convert_lang('Minute')+'</span></div><div class="minute_new_remind w-full flex items-center" data-is_show="" data="" onclick="show_select_minute_new_remind(\'.minute_new_remind\')"></div>';
			break;
		case 'every few hours':
			form = '<div class="header_minute_new_remind relative"><span class="absolute cursor-default" onclick="show_select_minute_new_remind(\'.minute_new_remind\')">'+convert_lang('Minute')+'</span></div><div class="minute_new_remind w-full flex items-center" data-is_show="" data="" onclick="show_select_minute_new_remind(\'.minute_new_remind\')"></div><div class="header_interval_new_remind relative"><span class="absolute cursor-default" onclick="show_select_interval_new_remind(\'.interval_new_remind\')">'+convert_lang('Interval')+'</span></div><div class="interval_new_remind w-full flex items-center" data-is_show="" data="" onclick="show_select_interval_new_remind(\'.interval_new_remind\')"></div>';
			break;
		case 'at a certain hour':
			form = '<div class="header_hour_and_minute_new_remind relative"><span class="absolute cursor-default" onclick="show_select_hour_and_minute_new_remind(\'.hour_and_minute_new_remind\')">'+convert_lang('Hour and minute')+'</span></div><div class="hour_and_minute_new_remind w-full flex items-center" data-is_show="" data="" onclick="show_select_hour_and_minute_new_remind(\'.hour_and_minute_new_remind\')"></div>';
			break;
		case 'every few days':
			form = '<div class="header_hour_and_minute_new_remind relative"><span class="absolute cursor-default" onclick="show_select_hour_and_minute_new_remind(\'.hour_and_minute_new_remind\')">'+convert_lang('Hour and minute')+'</span></div><div class="hour_and_minute_new_remind w-full flex items-center" data-is_show="" data="" onclick="show_select_hour_and_minute_new_remind(\'.hour_and_minute_new_remind\')"></div><div class="header_interval_new_remind relative"><span class="absolute cursor-default" onclick="show_select_interval_new_remind(\'.interval_new_remind\')">'+convert_lang('Interval')+'</span></div><div class="interval_new_remind w-full flex items-center" data-is_show="" data="" onclick="show_select_interval_new_remind(\'.interval_new_remind\')"></div>';
			break;
		case 'at a certain day':
			form = '<div class="header_day_new_remind relative"><span class="absolute cursor-default" onclick="show_select_day_new_remind(\'.day_new_remind\')">'+convert_lang('Day')+'</span></div><div class="day_new_remind w-full flex items-center" data-is_show="" data="" onclick="show_select_day_new_remind(\'.day_new_remind\')"></div><div class="header_hour_and_minute_new_remind relative"><span class="absolute cursor-default" onclick="show_select_hour_and_minute_new_remind(\'.hour_and_minute_new_remind\')">'+convert_lang('Hour and minute')+'</span></div><div class="hour_and_minute_new_remind w-full flex items-center" data-is_show="" data="" onclick="show_select_hour_and_minute_new_remind(\'.hour_and_minute_new_remind\')"></div>';
			break;
		case 'on a certain date':
			form = '<div class="header_number_new_remind relative"><span class="absolute cursor-default" onclick="show_select_number_new_remind(\'.number_new_remind\')">'+convert_lang('Number')+'</span></div><div class="number_new_remind w-full flex items-center" data-is_show="" data="" onclick="show_select_number_new_remind(\'.number_new_remind\')"></div><div class="header_hour_and_minute_new_remind relative"><span class="absolute cursor-default" onclick="show_select_hour_and_minute_new_remind(\'.hour_and_minute_new_remind\')">'+convert_lang('Hour and minute')+'</span></div><div class="hour_and_minute_new_remind w-full flex items-center" data-is_show="" data="" onclick="show_select_hour_and_minute_new_remind(\'.hour_and_minute_new_remind\')"></div>';
			break;
		case 'in a certain month':
			form = '<div class="header_month_new_remind relative"><span class="absolute cursor-default" onclick="show_select_month_new_remind(\'.month_new_remind\')">'+convert_lang('Month')+'</span></div><div class="month_new_remind w-full flex items-center" data-is_show="" data="" onclick="show_select_month_new_remind(\'.month_new_remind\')"></div><div class="header_number_new_remind relative"><span class="absolute cursor-default" onclick="show_select_number_new_remind(\'.number_new_remind\')">'+convert_lang('Number')+'</span></div><div class="number_new_remind w-full flex items-center" data-is_show="" data="" onclick="show_select_number_new_remind(\'.number_new_remind\')"></div><div class="header_hour_and_minute_new_remind relative"><span class="absolute cursor-default" onclick="show_select_hour_and_minute_new_remind(\'.hour_and_minute_new_remind\')">'+convert_lang('Hour and minute')+'</span></div><div class="hour_and_minute_new_remind w-full flex items-center" data-is_show="" data="" onclick="show_select_hour_and_minute_new_remind(\'.hour_and_minute_new_remind\')"></div>';
			break;
		case 'every few months':
			form = '<div class="header_number_new_remind relative"><span class="absolute cursor-default" onclick="show_select_number_new_remind(\'.number_new_remind\')">'+convert_lang('Number')+'</span></div><div class="number_new_remind w-full flex items-center" data-is_show="" data="" onclick="show_select_number_new_remind(\'.number_new_remind\')"></div><div class="header_hour_and_minute_new_remind relative"><span class="absolute cursor-default" onclick="show_select_hour_and_minute_new_remind(\'.hour_and_minute_new_remind\')">'+convert_lang('Hour and minute')+'</span></div><div class="hour_and_minute_new_remind w-full flex items-center" data-is_show="" data="" onclick="show_select_hour_and_minute_new_remind(\'.hour_and_minute_new_remind\')"></div><div class="header_interval_new_remind relative"><span class="absolute cursor-default" onclick="show_select_interval_new_remind(\'.interval_new_remind\')">'+convert_lang('Interval')+'</span></div><div class="interval_new_remind w-full flex items-center" data-is_show="" data="" onclick="show_select_interval_new_remind(\'.interval_new_remind\')"></div>';
			break;
		case 'specific date (once)':
			form = '<div class="header_number_new_remind relative"><span class="absolute cursor-default" onclick="show_select_number_new_remind(\'.number_new_remind\')">'+convert_lang('Number')+'</span></div><div class="number_new_remind w-full flex items-center" data-is_show="" data="" onclick="show_select_number_new_remind(\'.number_new_remind\')"></div><div class="header_month_new_remind relative"><span class="absolute cursor-default" onclick="show_select_month_new_remind(\'.month_new_remind\')">'+convert_lang('Month')+'</span></div><div class="month_new_remind w-full flex items-center" data-is_show="" data="" onclick="show_select_month_new_remind(\'.month_new_remind\')"></div><div class="header_hour_and_minute_new_remind relative"><span class="absolute cursor-default" onclick="show_select_hour_and_minute_new_remind(\'.hour_and_minute_new_remind\')">'+convert_lang('Hour and minute')+'</span></div><div class="hour_and_minute_new_remind w-full flex items-center" data-is_show="" data="" onclick="show_select_hour_and_minute_new_remind(\'.hour_and_minute_new_remind\')"></div>';
			break;
	}
	return form;
}

function show_select_minute_new_remind(selector, is_no_open_window = false){
	var elem = $(selector);
	if(elem.attr('data-is_show') == ''){
		elem.attr('data-is_show', '1');
		elem.html('<div class="time_item_reminder w-fit flex items-center justify-center cursor-pointer" onclick="get_minute_remind_window(\'open\')"><span>'+convert_lang('not chosen')+'</span></div>');
		var elem = $('.header_minute_new_remind > span');
		elem.css('top', '0').css('left', '0');
		elem.addClass('is_selected_color');
		$('.header_minute_new_remind').css('height', '1.5em');
		if(is_no_open_window === false){
			get_minute_remind_window('open');
		}
	}
}

function show_select_interval_new_remind(selector, is_no_open_window = false){
	var elem = $(selector);
	if(elem.attr('data-is_show') == ''){
		elem.attr('data-is_show', '1');
		elem.html('<div class="interval_item_reminder w-fit flex items-center justify-center cursor-pointer" onclick="get_interval_remind_window(\'open\')"><span>'+convert_lang('not chosen')+'</span></div>');
		var elem = $('.header_interval_new_remind > span');
		elem.css('top', '0').css('left', '0');
		elem.addClass('is_selected_color');
		$('.header_interval_new_remind').css('height', '1.5em');
		if(is_no_open_window === false){
			get_interval_remind_window('open');
		}
	}
}

function show_select_hour_and_minute_new_remind(selector, is_no_open_window = false){
	var elem = $(selector);
	if(elem.attr('data-is_show') == ''){
		elem.attr('data-is_show', '1');
		elem.html('<div class="time_item_reminder w-fit flex items-center justify-center cursor-pointer" onclick="get_hour_and_minute_remind_window(\'open\')"><span>'+convert_lang('not chosen')+'</span></div>');
		var elem = $('.header_hour_and_minute_new_remind > span');
		elem.css('top', '0').css('left', '0');
		elem.addClass('is_selected_color');
		$('.header_hour_and_minute_new_remind').css('height', '1.5em');
		if(is_no_open_window === false){
			get_hour_and_minute_remind_window('open');
		}
	}
}

function show_select_day_new_remind(selector, is_no_open_window = false){
	var elem = $(selector);
	if(elem.attr('data-is_show') == ''){
		elem.attr('data-is_show', '1');
		elem.html('<div class="day_item_reminder w-fit flex items-center justify-center cursor-pointer" onclick="get_day_remind_window(\'open\')"><span>'+convert_lang('not chosen')+'</span></div>');
		var elem = $('.header_day_new_remind > span');
		elem.css('top', '0').css('left', '0');
		elem.addClass('is_selected_color');
		$('.header_day_new_remind').css('height', '1.5em');
		if(is_no_open_window === false){
			get_day_remind_window('open');
		}
	}
}

function show_select_number_new_remind(selector, is_no_open_window = false){
	var elem = $(selector);
	if(elem.attr('data-is_show') == ''){
		elem.attr('data-is_show', '1');
		elem.html('<div class="number_item_reminder w-fit flex items-center justify-center cursor-pointer" onclick="get_number_remind_window(\'open\')"><span>'+convert_lang('not chosen')+'</span></div>');
		var elem = $('.header_number_new_remind > span');
		elem.css('top', '0').css('left', '0');
		elem.addClass('is_selected_color');
		$('.header_number_new_remind').css('height', '1.5em');
		if(is_no_open_window === false){
			get_number_remind_window('open');
		}
	}
}

function show_select_month_new_remind(selector, is_no_open_window = false){
	var elem = $(selector);
	if(elem.attr('data-is_show') == ''){
		elem.attr('data-is_show', '1');
		elem.html('<div class="month_item_reminder w-fit flex items-center justify-center cursor-pointer" onclick="get_month_remind_window(\'open\')"><span>'+convert_lang('not chosen')+'</span></div>');
		var elem = $('.header_month_new_remind > span');
		elem.css('top', '0').css('left', '0');
		elem.addClass('is_selected_color');
		$('.header_month_new_remind').css('height', '1.5em');
		if(is_no_open_window === false){
			get_month_remind_window('open');
		}
	}
}

function get_minute_remind_window(act){
	var elem = $('.minute_remind_window');
	if(act == 'open'){
		var is_hidden = elem.hasClass('hidden');
		if(is_hidden){
			elem.css('z-index', z_index_window);
			elem.removeClass('hidden');
			elem.animate({opacity: 1}, 100, function(){
				control_resize_all_window();
			});
			get_dark_background(act);
			z_index_window++;
		}
		$('.header_minute_remind_window > span').html(convert_lang('MINUTE'));
		var minute = $('.minute_new_remind div.time_item_reminder > span').html().replace(/[^0-9]/g, '');
		if(minute === ''){
			minute = '0';
		}else{
			if(minute.length > 1 && minute[0] === '0'){
				minute = minute.substr(1, 3);
			}
		}
		$('.content_minute_remind_window > div div.comment_remind > span').html(convert_lang('A reminder will come exactly the minute you install'));
		$('.content_minute_remind_window > div div.block_input_set_params').html('<div class="flex justify-center"><input class="input_minute_remind input" maxlength="2" value="'+minute+'" dir="rtl" oninput="check_input_value(this, \'minute\')" onkeypress="if((arguments[0]||window.event).keyCode==13){set_minute()}"><div class="text_minute_set_params flex items-center" onclick="$(\'.input_minute_remind\').select();"><span>'+convert_lang('minutes2')+'</span></div></div>');
		$('.content_minute_remind_window div.block_button').html('<button class="bt_set_minute button flex items-center justify-center" onclick="set_minute()">'+convert_lang('Ready')+'</button>');
		var e = $('.input_minute_remind');
		e.off('click');
		e.on('click', function(){
			e.select();
		});
		e.select();
	}else{
		elem.animate({opacity: 0}, 100, function(){
			var e = $(this);
			e.addClass('hidden');
			e.css('margin', '');
		});
		$('.content_minute_remind_window > div div.block_input_set_params').html('');
		$('.content_minute_remind_window div.block_button').html('');
		get_dark_background(act);
	}
}

function get_interval_remind_window(act){
	var elem = $('.interval_remind_window');
	if(act == 'open'){
		var act_interval = get_act_interval();
		var is_hidden = elem.hasClass('hidden');
		if(is_hidden){
			elem.css('z-index', z_index_window);
			elem.removeClass('hidden');
			elem.animate({opacity: 1}, 100, function(){
				control_resize_all_window()
			});
			get_dark_background(act);
			z_index_window++;
		}
		$('.header_interval_remind_window > span').html(convert_lang('INTERVAL'));
		var interval = $('.interval_new_remind div.interval_item_reminder > span').html().replace(/[^0-9]/g, '');
		if(interval === '' || interval === '0'){
			interval = '1';
		}else{
			if(interval.length > 1 && interval[0] === '0'){
				interval = interval.substr(1, 3);
			}
		}
		$('.content_interval_remind_window > div div.comment_remind > span').html(convert_lang('The reminder will come exactly after the time interval that you set'));
		$('.content_interval_remind_window > div div.block_input_set_params').html('<div class="flex justify-center"><input class="input_interval_remind input" maxlength="4" value="'+interval+'" dir="rtl" oninput="check_input_value(this, \'interval_'+act_interval+'\')" onkeypress="if((arguments[0]||window.event).keyCode==13){set_interval()}"><div class="text_interval_set_params flex items-center" onclick="$(\'.input_interval_remind\').select();"><span>'+convert_lang(act_interval)+'</span></div></div>');
		$('.content_interval_remind_window div.block_button').html('<button class="bt_set_interval button flex items-center justify-center" onclick="set_interval()">'+convert_lang('Ready')+'</button>');
		var e = $('.input_interval_remind');
		e.off('click');
		e.on('click', function(){
			e.select();
		});
		e.select();
		check_input_value($('.input_interval_remind')[0], 'interval_'+act_interval);
	}else{
		elem.animate({opacity: 0}, 100, function(){
			var e = $(this);
			e.addClass('hidden');
			e.css('margin', '');
		});
		$('.content_interval_remind_window > div div.block_input_set_params').html('');
		$('.content_interval_remind_window div.block_button').html('');
		get_dark_background(act);
	}
}

function get_hour_and_minute_remind_window(act){
	var elem = $('.hour_and_minute_remind_window');
	if(act == 'open'){
		var is_hidden = elem.hasClass('hidden');
		if(is_hidden){
			elem.css('z-index', z_index_window);
			elem.removeClass('hidden');
			elem.animate({opacity: 1}, 100, function(){
				control_resize_all_window()
			});
			get_dark_background(act);
			z_index_window++;
		}
		$('.header_hour_and_minute_remind_window > span').html(convert_lang('HOUR AND MINUTE'));
		var hour_and_minute = $('.hour_and_minute_new_remind div.time_item_reminder > span').html().replace(/[^0-9:]/g, '');
		var ex = hour_and_minute.split(':');
		var hour = 0, minute = 0;
		if(ex.length > 1){
			hour = ex[0];
			minute = ex[1];
		}
		if(hour === ''){
			hour = '0';
		}else{
			if(hour.length > 1 && hour[0] === '0'){
				hour = hour.substr(1, 3);
			}
		}
		if(minute === ''){
			minute = '0';
		}else{
			if(minute.length > 1 && minute[0] === '0'){
				minute = minute.substr(1, 3);
			}
		}
		$('.content_hour_and_minute_remind_window > div div.comment_remind > span').html(convert_lang('The reminder will come exactly at the hour and minute that you set'));
		$('.content_hour_and_minute_remind_window > div div.block_input_set_params').html('<div class="block_input_hour_and_minute flex justify-between"><div class="flex justify-center"><input class="input_hour_remind input" maxlength="2" value="'+hour+'" dir="rtl" oninput="check_input_value(this, \'hour\')" onkeypress="if((arguments[0]||window.event).keyCode==13){set_hour_and_minute()}"><div class="text_hour_set_params flex items-center" onclick="$(\'.input_hour_remind\').select();"><span>'+convert_lang('hours2')+'</span></div></div><div class="flex justify-center"><input class="input_minute_remind input" maxlength="2" value="'+minute+'" dir="rtl" oninput="check_input_value(this, \'minute\')" onkeypress="if((arguments[0]||window.event).keyCode==13){set_hour_and_minute()}"><div class="text_minute_set_params flex items-center" onclick="$(\'.input_minute_remind\').select();"><span>'+convert_lang('minutes2')+'</span></div></div></div>');
		$('.content_hour_and_minute_remind_window div.block_button').html('<button class="bt_set_hour_and_minute button flex items-center justify-center" onclick="set_hour_and_minute()">'+convert_lang('Ready')+'</button>');
		var e = $('.input_hour_remind');
		e.off('click');
		e.on('click', function(){
			e.select();
		});
		e.select();
		var e = $('.input_minute_remind');
		e.off('click');
		e.on('click', function(){
			e.select();
		});
		e.select();
	}else{
		elem.animate({opacity: 0}, 100, function(){
			var e = $(this);
			e.addClass('hidden');
			e.css('margin', '');
		});
		$('.content_hour_and_minute_remind_window > div div.block_input_set_params').html('');
		$('.content_hour_and_minute_remind_window div.block_button').html('');
		get_dark_background(act);
	}
}

function get_day_remind_window(act){
	var elem = $('.day_remind_window');
	if(act == 'open'){
		var is_hidden = elem.hasClass('hidden');
		if(is_hidden){
			elem.css('z-index', z_index_window);
			elem.removeClass('hidden');
			elem.animate({opacity: 1}, 100, function(){
				control_resize_all_window()
			});
			get_dark_background(act);
			z_index_window++;
		}
		$('.header_day_remind_window > span').html(convert_lang('DAY'));
		$('div[data="monday"] > span').html(convert_lang('monday'));
		$('div[data="tuesday"] > span').html(convert_lang('tuesday'));
		$('div[data="wednesday"] > span').html(convert_lang('wednesday'));
		$('div[data="thursday"] > span').html(convert_lang('thursday'));
		$('div[data="friday"] > span').html(convert_lang('friday'));
		$('div[data="saturday"] > span').html(convert_lang('saturday'));
		$('div[data="sunday"] > span').html(convert_lang('sunday'));
	}else{
		elem.animate({opacity: 0}, 100, function(){
			var e = $(this);
			e.addClass('hidden');
			e.css('margin', '');
		});
		get_dark_background(act);
	}
}

function get_number_remind_window(act){
	var elem = $('.number_remind_window');
	if(act == 'open'){
		var is_hidden = elem.hasClass('hidden');
		if(is_hidden){
			elem.css('z-index', z_index_window);
			elem.removeClass('hidden');
			elem.animate({opacity: 1}, 100, function(){
				control_resize_all_window()
			});
			get_dark_background(act);
			z_index_window++;
		}
		$('.header_number_remind_window > span').html(convert_lang('NUMBER'));
		var number = $('.number_new_remind div.number_item_reminder > span').html().replace(/[^0-9]/g, '');
		if(number === ''){
			number = '1';
		}else{
			if(number.length > 1 && number[0] === '0'){
				number = number.substr(1, 3);
			}
		}
		$('.content_number_remind_window > div div.comment_remind > span').html(convert_lang('The reminder will come exactly on the date you set'));
		$('.content_number_remind_window > div div.block_input_set_params').html('<div class="flex justify-center"><input class="input_number_remind input" maxlength="2" value="'+number+'" dir="rtl" oninput="check_input_value(this, \'number\')" onkeypress="if((arguments[0]||window.event).keyCode==13){set_number()}"><div class="text_number_set_params flex items-center" onclick="$(\'.input_number_remind\').select();"><span>'+convert_lang('day of the month')+'</span></div></div>');
		$('.content_number_remind_window div.block_button').html('<button class="bt_set_number button flex items-center justify-center" onclick="set_number()">'+convert_lang('Ready')+'</button>');
		var e = $('.input_number_remind');
		e.off('click');
		e.on('click', function(){
			e.select();
		});
		e.select();
	}else{
		elem.animate({opacity: 0}, 100, function(){
			var e = $(this);
			e.addClass('hidden');
			e.css('margin', '');
		});
		$('.content_number_remind_window > div div.block_input_set_params').html('');
		$('.content_number_remind_window div.block_button').html('');
		get_dark_background(act);
	}
}

function get_month_remind_window(act){
	var elem = $('.month_remind_window');
	if(act == 'open'){
		var is_hidden = elem.hasClass('hidden');
		if(is_hidden){
			elem.css('z-index', z_index_window);
			elem.removeClass('hidden');
			elem.animate({opacity: 1}, 100, function(){
				control_resize_all_window()
			});
			get_dark_background(act);
			z_index_window++;
		}
		$('.header_month_remind_window > span').html(convert_lang('MONTH'));
		$('div[data="january"] > span').html(convert_lang('january'));
		$('div[data="february"] > span').html(convert_lang('february'));
		$('div[data="march"] > span').html(convert_lang('march'));
		$('div[data="april"] > span').html(convert_lang('april'));
		$('div[data="may"] > span').html(convert_lang('may'));
		$('div[data="june"] > span').html(convert_lang('june'));
		$('div[data="july"] > span').html(convert_lang('july'));
		$('div[data="august"] > span').html(convert_lang('august'));
		$('div[data="september"] > span').html(convert_lang('september'));
		$('div[data="october"] > span').html(convert_lang('october'));
		$('div[data="november"] > span').html(convert_lang('november'));
		$('div[data="december"] > span').html(convert_lang('december'));
	}else{
		elem.animate({opacity: 0}, 100, function(){
			var e = $(this);
			e.addClass('hidden');
			e.css('margin', '');
		});
		get_dark_background(act);
	}
}

function set_minute(){
	var minute = $('.input_minute_remind').val();
	if(minute === '' ){
		minute = 0;
	}
	if(+minute < 9){
		minute = '0'+String(minute);
	}
	var elem = $('.minute_new_remind');
	elem.attr('data', '1');
	elem.removeClass('is_error_color');
	$(elem[0].previousElementSibling.firstElementChild).css('color', '');
	$('.minute_new_remind div.time_item_reminder > span').html('**:'+minute);
	get_minute_remind_window('close');
	remind_conf['minute'] = +minute;
}

function set_interval(){
	var interval = $('.input_interval_remind').val();
	if(interval === '' ){
		interval = 1;
	}
	var elem = $('.interval_new_remind');
	elem.attr('data', '1');
	elem.removeClass('is_error_color');
	$(elem[0].previousElementSibling.firstElementChild).css('color', '');
	var act_interval = get_act_interval();
	$('.interval_new_remind div.interval_item_reminder > span').html(convert_lang('interval')+': '+interval+' '+decline(interval, convert_lang(act_interval), convert_lang(act_interval+'s'), convert_lang(act_interval+'s2')));
	get_interval_remind_window('close');
	remind_conf['interval'] = +interval;
}

function set_hour_and_minute(){
	var minute = $('.input_minute_remind').val();
	if(minute === '' ){
		minute = 0;
	}
	if(+minute < 9){
		minute = '0'+String(minute);
	}
	var hour = $('.input_hour_remind').val();
	if(hour === '' ){
		hour = 0;
	}
	if(+hour < 9){
		hour = '0'+String(hour);
	}
	var elem = $('.hour_and_minute_new_remind');
	elem.attr('data', '1');
	elem.removeClass('is_error_color');
	$(elem[0].previousElementSibling.firstElementChild).css('color', '');
	$('.hour_and_minute_new_remind div.time_item_reminder > span').html(hour+':'+minute);
	get_hour_and_minute_remind_window('close');
	remind_conf['minute'] = +minute;
	remind_conf['hour'] = +hour;
}

function set_number(){
	var number = $('.input_number_remind').val();
	if(number === '' ){
		number = 1;
	}
	var month = $('.month_new_remind').attr('data');
	var max_number = months[month];
	if(+number > max_number){
		number = max_number;
	}
	var elem = $('.number_new_remind');
	elem.attr('data', '1');
	elem.removeClass('is_error_color');
	$(elem[0].previousElementSibling.firstElementChild).css('color', '');
	$('.number_new_remind div.number_item_reminder > span').html(number);
	get_number_remind_window('close');
	remind_conf['number'] = +number;
}

function check_input_value(elem, act){
	var elem = $(elem);
	var val = elem.val();
	switch(act){
		case 'text':
			remind_conf['message'] = val;
			break;
		case 'minute':
			if(+val > 59){
				elem.val(59);
			}
			if(~val.search(/[^0-9]/)){
				elem.val(0);
			}
			if(val.length > 1 && val[0] === '0'){
				elem.val(val.substr(1, 3));
			}
			$('.text_minute_set_params > span').html(decline(val, convert_lang('minute'), convert_lang('minutes'), convert_lang('minutes2')));
			break;
		case 'hour':
			if(+val > 23){
				elem.val(23);
			}
			if(~val.search(/[^0-9]/)){
				elem.val(0);
			}
			if(val.length > 1 && val[0] === '0'){
				elem.val(val.substr(1, 3));
			}
			$('.text_hour_set_params > span').html(decline(val, convert_lang('hour'), convert_lang('hours'), convert_lang('hours2')));
			break;
		case 'interval_hour':
			if(+val < 1){
				elem.val(1);
			}
			if(~val.search(/[^0-9]/)){
				elem.val(1);
			}
			if(val.length > 1 && val[0] === '0'){
				elem.val(val.substr(1, 3));
			}
			$('.text_interval_set_params > span').html(decline(val, convert_lang('hour'), convert_lang('hours'), convert_lang('hours2')));
			break;
		case 'interval_day':
			if(+val < 1){
				elem.val(1);
			}
			if(~val.search(/[^0-9]/)){
				elem.val(1);
			}
			if(val.length > 1 && val[0] === '0'){
				elem.val(val.substr(1, 3));
			}
			$('.text_interval_set_params > span').html(decline(val, convert_lang('day'), convert_lang('days'), convert_lang('days2')));
			break;
		case 'interval_month':
			if(+val < 1){
				elem.val(1);
			}
			if(~val.search(/[^0-9]/)){
				elem.val(1);
			}
			if(val.length > 1 && val[0] === '0'){
				elem.val(val.substr(1, 3));
			}
			$('.text_interval_set_params > span').html(decline(val, convert_lang('month'), convert_lang('months'), convert_lang('months2')));
			break;
		case 'number':
			if(+val < 1){
				elem.val(1);
			}
			if(+val > 31){
				elem.val(31);
			}
			if(~val.search(/[^0-9]/)){
				elem.val(1);
			}
			if(val.length > 1 && val[0] === '0'){
				elem.val(val.substr(1, 3));
			}
			break;
	}
}

function response__save_remind(result_){
	lock('delete', 'lock_save_remind');
	var elem = $('.bt_save_remind');
	elem.html(elem.attr('data'));
	var result = result__(result_);
	if(result == null){return;}
	if (result.response) {
		insert_item_remind(result.response, (remind_conf['act'] == 'new' ? 'prepend' : 'replace'));
		get_new_or_edit_remind_window('close');
		reset_form_remind();
		remind_conf = {'id':0, 'type':'', 'message':''};
		return;
	}
	if(result.error !== ''){
		get_error_window('open', result.error);
	}else{
		get_error_window('open', result_);
	}
}

function no_response__save_remind(){
	lock('delete', 'lock_save_remind');
	var elem = $('.bt_save_remind');
	elem.html(elem.attr('data'));
}

function save_remind(){
	if(lock('check', 'lock_save_remind')){
		return;
	}
	var elem = $('.text_new_remind');
	elem.removeClass('is_error_color');
	$(elem[0].previousElementSibling.firstElementChild).css('color', '');
	var elem = $('.type_new_remind');
	var type = elem.attr('data-type');
	elem.removeClass('is_error_color');
	$(elem[0].previousElementSibling.firstElementChild).css('color', '');
	if($('.input_text_new_remind').val().replace(/\r?\n| |	/g, '') == ''){
		var elem = $('.text_new_remind');
		elem.addClass('is_error_color');
		$(elem[0].previousElementSibling.firstElementChild).css('color', '#ff7272');
		return;
	}
	switch(type){
		case 'each hour':
			var elem = $('.minute_new_remind');
			if(elem.attr('data') == ''){
				elem.addClass('is_error_color');
				$(elem[0].previousElementSibling.firstElementChild).css('color', '#ff7272');
				return;
			}
			break;
		case 'every few hours':
			var elem = $('.minute_new_remind');
			if(elem.attr('data') == ''){
				elem.addClass('is_error_color');
				$(elem[0].previousElementSibling.firstElementChild).css('color', '#ff7272');
				return;
			}
			var elem = $('.interval_new_remind');
			if(elem.attr('data') == ''){
				elem.addClass('is_error_color');
				$(elem[0].previousElementSibling.firstElementChild).css('color', '#ff7272');
				return;
			}
			break;
		case 'at a certain hour':
			var elem = $('.hour_and_minute_new_remind');
			if(elem.attr('data') == ''){
				elem.addClass('is_error_color');
				$(elem[0].previousElementSibling.firstElementChild).css('color', '#ff7272');
				return;
			}
			break;
		case 'every few days':
			var elem = $('.hour_and_minute_new_remind');
			if(elem.attr('data') == ''){
				elem.addClass('is_error_color');
				$(elem[0].previousElementSibling.firstElementChild).css('color', '#ff7272');
				return;
			}
			var elem = $('.interval_new_remind');
			if(elem.attr('data') == ''){
				elem.addClass('is_error_color');
				$(elem[0].previousElementSibling.firstElementChild).css('color', '#ff7272');
				return;
			}
			break;
		case 'at a certain day':
			var elem = $('.day_new_remind');
			if(elem.attr('data') == ''){
				elem.addClass('is_error_color');
				$(elem[0].previousElementSibling.firstElementChild).css('color', '#ff7272');
				return;
			}
			var elem = $('.hour_and_minute_new_remind');
			if(elem.attr('data') == ''){
				elem.addClass('is_error_color');
				$(elem[0].previousElementSibling.firstElementChild).css('color', '#ff7272');
				return;
			}
			break;
		case 'on a certain date':
			var elem = $('.number_new_remind');
			if(elem.attr('data') == ''){
				elem.addClass('is_error_color');
				$(elem[0].previousElementSibling.firstElementChild).css('color', '#ff7272');
				return;
			}
			var elem = $('.hour_and_minute_new_remind');
			if(elem.attr('data') == ''){
				elem.addClass('is_error_color');
				$(elem[0].previousElementSibling.firstElementChild).css('color', '#ff7272');
				return;
			}
			break;
		case 'in a certain month':
			var elem = $('.month_new_remind');
			if(elem.attr('data') == ''){
				elem.addClass('is_error_color');
				$(elem[0].previousElementSibling.firstElementChild).css('color', '#ff7272');
				return;
			}
			var elem = $('.number_new_remind');
			if(elem.attr('data') == ''){
				elem.addClass('is_error_color');
				$(elem[0].previousElementSibling.firstElementChild).css('color', '#ff7272');
				return;
			}
			var elem = $('.hour_and_minute_new_remind');
			if(elem.attr('data') == ''){
				elem.addClass('is_error_color');
				$(elem[0].previousElementSibling.firstElementChild).css('color', '#ff7272');
				return;
			}
			break;
		case 'every few months':
			var elem = $('.number_new_remind');
			if(elem.attr('data') == ''){
				elem.addClass('is_error_color');
				$(elem[0].previousElementSibling.firstElementChild).css('color', '#ff7272');
				return;
			}
			var elem = $('.hour_and_minute_new_remind');
			if(elem.attr('data') == ''){
				elem.addClass('is_error_color');
				$(elem[0].previousElementSibling.firstElementChild).css('color', '#ff7272');
				return;
			}			
			var elem = $('.interval_new_remind');
			if(elem.attr('data') == ''){
				elem.addClass('is_error_color');
				$(elem[0].previousElementSibling.firstElementChild).css('color', '#ff7272');
				return;
			}
			break;
		case 'specific date (once)':
			var elem = $('.number_new_remind');
			if(elem.attr('data') == ''){
				elem.addClass('is_error_color');
				$(elem[0].previousElementSibling.firstElementChild).css('color', '#ff7272');
				return;
			}
			var elem = $('.month_new_remind');
			if(elem.attr('data') == ''){
				elem.addClass('is_error_color');
				$(elem[0].previousElementSibling.firstElementChild).css('color', '#ff7272');
				return;
			}
			var elem = $('.hour_and_minute_new_remind');
			if(elem.attr('data') == ''){
				elem.addClass('is_error_color');
				$(elem[0].previousElementSibling.firstElementChild).css('color', '#ff7272');
				return;
			}
			break;
		default:
			var elem = $('.type_new_remind');
			elem.addClass('is_error_color');
			$(elem[0].previousElementSibling.firstElementChild).css('color', '#ff7272');
			return;
			break;
	}
	$('.bt_save_remind').html(show_animation_load('1.5em', '1.5em', '#196c6c'));
	remind_conf['user_id'] = tg_obj.initDataUnsafe.user.id;
	remind_conf['act'] = $('.header_add_or_edit_remind_window > span').attr('data');
	var payload = remind_conf;
	var options = {
		'method': 'POST',
		'response_callback': response__save_remind,
		'no_response_callback': no_response__save_remind
	};
	send_ajax('/save_remind', payload, options);
	lock('add', 'lock_save_remind');
}

function reset_form_remind(){
	var elem = $('.text_new_remind');
	elem.css('height', '');
	elem.attr('data-is_show', '');
	var elem = $('.header_text_new_remind > span');
	elem.css('top', '').css('left', '');
	elem.removeClass('is_selected_color');
	$('.header_text_new_remind').css('height', '');
	var elem = $('.input_text_new_remind');
	elem.addClass('hidden');
	elem.removeClass('show_input_text_new_remind');
	elem.val('');		
	$('.content_add_or_edit_remind_window div.block_select_next_new_remind').html('');
	var elem = $('.type_new_remind');
	elem.attr('data-is_show', '');
	elem.attr('data-type', '');
	elem.html('');
	var elem = $('.header_type_new_remind > span');
	elem.css('top', '').css('left', '');
	elem.removeClass('is_selected_color');
	$('.header_type_new_remind').css('height', '');
}

function get_confirm_delete_remind_window(act, id){
	var elem = $('.confirm_delete_remind_window');
	if(act == 'open'){
		var is_hidden = elem.hasClass('hidden');
		if(is_hidden){
			elem.css('z-index', z_index_window);
			elem.removeClass('hidden');
			elem.animate({opacity: 1}, 100);
			get_dark_background(act);
			z_index_window++;
		}
		$('.header_confirm_delete_remind_window > span').html(convert_lang('Delete a reminder'));
		$('.content_confirm_delete_remind_window div.comment_remind > span').html(convert_lang('Are you sure you want to delete this reminder?'));
		$('.content_confirm_delete_remind_window div.block_button').html('<button class="bt_delete_remind button flex items-center justify-center" onclick="delete_remind('+id+')" data="'+convert_lang('Delete')+'">'+convert_lang('Delete')+'</button>');
		$('.item_reminder_'+id).css('border', '0.1em solid #fbb6b6');
	}else{
		elem.animate({opacity: 0}, 100, function(){
			$(this).addClass('hidden');
		});
		$('.item_reminder').css('border', '');
		get_dark_background(act);
	}
}

function response__delete_remind(result_){
	var elem = $('.bt_delete_remind');
	elem.html(elem.attr('data'));
	var result = result__(result_);
	if(result == null){return;}
	if (result.response) {
		$('.item_reminder_'+result.response.id).remove();
		delete all_reminds[result.response.id];
		get_confirm_delete_remind_window('close');
		var elem = $('.all_reminders_block');
		if(elem.children().length == 0){
			elem.addClass('justify-center');
			elem.html('<div class="text_no_reminders flex items-center"><span>'+convert_lang('No reminders')+'</span></div><div class="block_add_new_remind overflow-hidden relative"><i class="icon_add_new_remind absolute cursor-pointer" style="top:0.5em;" onclick="get_new_or_edit_remind_window(\'open\', \'new\')"></i></div>');
			$('.block_add_new_remind_').html('');
			reset_form_remind();
		}
		return;
	}
	if(result.error !== ''){
		get_error_window('open', result.error);
	}else{
		get_error_window('open', result_);
	}
}

function no_response__delete_remind(){
	var elem = $('.bt_delete_remind');
	elem.html(elem.attr('data'));
}

function delete_remind(id){
	var options = {
		'method': 'DELETE',
		'response_callback': response__delete_remind,
		'no_response_callback': no_response__delete_remind
	};
	$('.bt_delete_remind').html(show_animation_load('1.5em', '1.5em', '#196c6c'));
	send_ajax('/delete_remind?user_id='+tg_obj.initDataUnsafe.user.id+'&id='+id, null, options);
}

function init_control_resize_add_or_edit_remind_window(){
	function _add_or_edit_remind_window(){
		if(add_or_edit_remind_window.offsetHeight > window.innerHeight){
			add_or_edit_remind_window.style.margin = '0 auto';
		}else{
			add_or_edit_remind_window.style.margin = '';
		}
	}
	new ResizeObserver(_add_or_edit_remind_window).observe(add_or_edit_remind_window);
}

// function to control the height of all windows depending on the height of the display when changing the display size
function control_resize_all_window(){
	var elems = $('.window_');
	for(var item of elems){
		var elem = $(item);
		if(!elem.hasClass('hidden')){
			if(elem[0].offsetHeight > window.innerHeight){
				elem.css('margin', '0 auto');
			}else{
				elem.css('margin', '');
			}
		}
	}	
}

window.onresize = function(){
	control_resize_all_window(); 
};

document.addEventListener('DOMContentLoaded', async function(){
	await get_lang_json(); // get the language json file
	save_timezone(); // send the user's time zone to the server
	init_control_resize_add_or_edit_remind_window(); // window height control function depending on the display height
});

# -*- coding: utf-8 -*-

import os
import re
import sys
import datetime
import traceback
import threading
import time
import copy
import telebot # pip3 install pytelegrambotapi
from dotenv import load_dotenv # pip install python-dotenv
import random
import shutil
import json


install_dir = ''
app_version = '3.6'
ids_auth_telegram_chats = []
results_for_telegram = []
reminder_types = {'each hour':'каждый час', 'every few hours':'раз в несколько часов', 'at a certain hour':'в определенный час', 'every few days':'раз в несколько дней', 'at a certain day':'в определенный день', 'to a certain number':'в определенное число', 'in a certain month':'в определенный месяц', 'every few months':'раз в несколько месяцев', 'specific date':'определенная дата'}
weekdays = {'понедельник':0, 'вторник':1, 'среда':2, 'четверг':3, 'пятница':4, 'суббота':5, 'воскресенье':6}
months = {'январь':31, 'февраль':28, 'март':31, 'апрель':30, 'май':31, 'июнь':30, 'июль':31, 'август':31, 'сентябрь':30, 'октябрь':31, 'ноябрь':30, 'декабрь':31}
months2 = {1:31, 2:28, 3:31, 4:30, 5:31, 6:30, 7:31, 8:31, 9:30, 10:31, 11:30, 12:31}
months3 = {'январь':1, 'февраль':2, 'март':3, 'апрель':4, 'май':5, 'июнь':6, 'июль':7, 'август':8, 'сентябрь':9, 'октябрь':10, 'ноябрь':11, 'декабрь':12}
list_leap_years = [2020, 2024, 2028, 2032, 2036, 2040, 2044, 2048, 2052, 2056, 2060, 2064, 2068, 2072, 2076, 2080, 2084, 2088, 2092, 2096]
reminders_list = {}
config_app = {}
lock_1 = threading.RLock()
lock_2 = threading.RLock()
lock_4 = threading.RLock()
lock_5 = threading.RLock()
lock_6 = threading.RLock()

def log_other_error(mes) -> None:

	lock_1.acquire()
	try:

		if mes:

			line = sys._getframe(1).f_lineno

			date = datetime.datetime.now().strftime('%d-%m-%Y %H:%M:%S')
			mes = date+' (line:'+str(line)+') '+str(mes) + '\n'+'----------------------------------------------------------------------------------------' + '\n'
			
			with open(install_dir+'/other_errors.log', 'a+', encoding = 'utf-8') as f:
				f.write(mes)

	except Exception:
		pass
	finally:
		lock_1.release()

def parse_env() -> None:
	
	global config_app
	
	try:

		load_dotenv()
		
		config_app['telegram_token'] = os.getenv('TELEGRAM_TOKEN')
		config_app['service_password'] = os.getenv('SERVICE_PASSWORD')

		if not config_app['telegram_token']:
			print(f'[Error] telegram_token is empty. See {install_dir}/.env file')
			time.sleep(5)
			sys.exit(1)
		
		if not config_app['service_password']:
			print(f'[Error] service_password is empty. See {install_dir}/.env file')
			time.sleep(5)
			sys.exit(1)

	except Exception:
		log_other_error(traceback.format_exc().strip())

def preparing_and_checking_files() -> None:
	
	global ids_auth_telegram_chats, reminders_list

	try:
			
		if not os.path.isfile(install_dir+'/other_errors.log'):
			with open(install_dir+'/other_errors.log', 'w+'):
				pass

		if not os.path.isfile(install_dir+'/ids_auth_telegram_chats'):
			with open(install_dir+'/ids_auth_telegram_chats', 'w+'):
				pass

		if not os.path.exists(install_dir+'/reminders'):
			os.mkdir(install_dir+'/reminders')

		parse_env()

		lines = []
		with open(install_dir+'/ids_auth_telegram_chats', 'r', encoding = 'utf-8') as f:
			lines = f.readlines()
		for item in lines:
			ex = re.split(r'([0-9\-]+)', item.strip())
			if len(ex) > 1:
				ids_auth_telegram_chats.append(int(ex[1]))

		path, dirs, files = next(os.walk(install_dir+'/reminders'))

		for item in dirs:

			message_chat_id = int(item)
			hour_offset = ''

			if os.path.isfile(path+'/'+item+'/hour_offset'):
				with open(path+'/'+item+'/hour_offset', 'r', encoding = 'utf-8') as f:
					hour_offset = f.readline()
				
			if hour_offset and not message_chat_id in reminders_list:
				reminders_list[message_chat_id] = [{'hour_offset':hour_offset}]

			lines = []
			if os.path.isfile(path+'/'+item+'/list'):
				with open(path+'/'+item+'/list', 'r', encoding = 'utf-8') as f:
					lines = f.readlines()

			for i in lines:

				type_ = None
				month = None
				day = None
				weekday = None
				hour = None
				minute = None
				interval = None
				mess = None
				id_ = None
				conf = None

				ex = re.split(r'type:([a-z ]+)', i.strip())
				if len(ex) > 1:
					type_ = ex[1]
				ex = re.split(r'month:([а-я]+)', i.strip())
				if len(ex) > 1:
					month = ex[1]
				ex = re.split(r'day:([0-9]+)', i.strip())
				if len(ex) > 1:
					day = int(ex[1])
				ex = re.split(r'weekday:([а-я]+)', i.strip())
				if len(ex) > 1:
					weekday = ex[1]
				ex = re.split(r'hour:([0-9]+)', i.strip())
				if len(ex) > 1:
					hour = int(ex[1])
				ex = re.split(r'minute:([0-9]+)', i.strip())
				if len(ex) > 1:
					minute = int(ex[1])
				ex = re.split(r'interval:([0-9]+)', i.strip())
				if len(ex) > 1:
					interval = int(ex[1])
				ex = re.split(r'mess:([^\|]+)', i.strip())
				if len(ex) > 1:
					mess = ex[1]
				ex = re.split(r'id:([0-9]+)', i.strip())
				if len(ex) > 1:
					id_ = int(ex[1])
				ex = re.split(r'conf:(.+)', i.strip())
				if len(ex) > 1:
					if ex[1] != '':
						conf = json.JSONDecoder().decode(ex[1].replace("'", '"'))

				if id_:
					d = {'id':id_, 'type':type_, 'day':day, 'month':month, 'weekday':weekday, 'hour':hour, 'minute':minute, 'interval':interval, 'mess':mess}
					if not conf is None:
						d.update(conf)
					reminders_list[message_chat_id].append(d)

	except Exception:
		log_other_error(traceback.format_exc().strip())

def distribution_of_results_for_telegram() -> None:

	global results_for_telegram, ids_auth_telegram_chats

	try:

		bot = telebot.TeleBot(config_app['telegram_token'])
		
		while True:
			
			time.sleep(2)

			if len(ids_auth_telegram_chats) > 0:
				
				results_for_telegram_ = []
		
				if len(results_for_telegram) > 0:

					lock_4.acquire()
					try:
						results_for_telegram_ = copy.deepcopy(results_for_telegram)
						results_for_telegram = []
					finally:
						lock_4.release()
	
					for item in results_for_telegram_:
						
						message = item['mess']
						message_chat_id = item['message_chat_id']

						time.sleep(0.5)

						for _ in range(3):

							try:
								
								bot.send_message(message_chat_id, text = message, disable_web_page_preview = True)
								break

							except telebot.apihelper.ApiException as err:
								
								time.sleep(1) # 4

								if 'Error code: 403' in str(err):

									if message_chat_id in ids_auth_telegram_chats:

										lock_5.acquire()
										try:
											ids_auth_telegram_chats.remove(message_chat_id)
										except Exception:
											pass
										finally:
											lock_5.release()

										if not os.path.exists(install_dir+'/reminders/'+str(message_chat_id)):
											shutil.rmtree(install_dir+'/reminders/'+str(message_chat_id), ignore_errors = True)

										lock_6.acquire()
										try:

											with open(install_dir+'/ids_auth_telegram_chats', 'r+', encoding = 'utf-8') as f:
												text = f.read()
												text = re.sub(str(message_chat_id) + '\n', '', text)
												f.truncate(0)
												with open(install_dir+'/ids_auth_telegram_chats', 'a+', encoding = 'utf-8') as f:
													f.write(text)

										finally:
											lock_6.release()
						
						time.sleep(4.5)

	except telebot.apihelper.ApiException as err:
		
		try:
			bot.stop_bot()
		except Exception:
			pass

		log_other_error(err)
		threading.Thread(target = restart_distribution_of_results_for_telegram, args = ()).start()

	except Exception:
		
		try:
			bot.stop_bot()
		except Exception:
			pass
			
		err = traceback.format_exc().strip()

		if not 'The read operation timed out' in err and not 'Read timed out.' in err:
			log_other_error(err)
			
		threading.Thread(target = restart_distribution_of_results_for_telegram, args = ()).start()

def restart_distribution_of_results_for_telegram() -> None:
	time.sleep(5)
	threading.Thread(target = distribution_of_results_for_telegram, args = ()).start()

def telegram_bot() -> None:
	
	try:
	
		bot = telebot.TeleBot(config_app['telegram_token'])
		
		@bot.callback_query_handler(func = lambda call: True)
		def callback_worker(call):
			
			global reminders_list

			bot.answer_callback_query(callback_query_id = call.id, text = 'Запрос отправлен, ожидайте', show_alert = False)
			
			ex = re.split(r'delete_reminder:([0-9]+)', call.data)
			if len(ex) > 1:
				
				id_ = int(ex[1])

				lock_2.acquire()
				try:
					
					for item in reminders_list:
						if item == call.message.chat.id:
							for idx, i in enumerate(reminders_list[item]):
								if idx > 0:
									if i['id'] == id_:
										reminders_list[item].pop(idx)
										break
							break

				finally:
					lock_2.release()
				
				bot.send_message(call.message.chat.id, 'Напоминание удалено')
				bot.delete_message(call.message.chat.id, call.message.message_id)

				update_reminders_list_in_file('delete', call.message.chat.id, {'id':id_})

				return

			if call.data == 'each hour':

				bot.send_message(call.message.chat.id, text = 'Вы выбрали тип напоминания "'+reminder_types[call.data]+'". Теперь введите команду в формате: <b>'+call.data+': minute mess</b>,\nгде:\nminute - минута, например <i>04</i>, <i>12</i> или <i>36</i>\nmess - сообщение которое должен прислать бот', parse_mode = 'HTML')
				return

			if call.data == 'every few hours':

				bot.send_message(call.message.chat.id, text = 'Вы выбрали тип напоминания "'+reminder_types[call.data]+'". Теперь введите команду в формате: <b>'+call.data+': minute interval mess</b>,\nгде:\nminute - минута, например <i>04</i>, <i>12</i> или <i>36</i>\ninterval - интервал в часах, например <i>4</i>, <i>7</i> или <i>12</i>\nmess - сообщение которое должен прислать бот', parse_mode = 'HTML')
				return

			if call.data == 'at a certain hour':

				bot.send_message(call.message.chat.id, text = 'Вы выбрали тип напоминания "'+reminder_types[call.data]+'". Теперь введите команду в формате: <b>'+call.data+': hour minute mess</b>,\nгде:\nhour - час, например <i>06</i>, <i>14</i> или <i>22</i>\nminute - минута, например <i>04</i>, <i>12</i> или <i>36</i>\nmess - сообщение которое должен прислать бот', parse_mode = 'HTML')
				return

			if call.data == 'every few days':

				bot.send_message(call.message.chat.id, text = 'Вы выбрали тип напоминания "'+reminder_types[call.data]+'". Теперь введите команду в формате: <b>'+call.data+': hour minute interval mess</b>,\nгде:\nhour - час, например <i>06</i>, <i>14</i> или <i>22</i>\nminute - минута, например <i>04</i>, <i>12</i> или <i>36</i>\ninterval - интервал в днях, например <i>4</i>, <i>7</i> или <i>12</i>\nmess - сообщение которое должен прислать бот', parse_mode = 'HTML')
				return

			if call.data == 'at a certain day':

				bot.send_message(call.message.chat.id, text = 'Вы выбрали тип напоминания "'+reminder_types[call.data]+'". Теперь введите команду в формате: <b>'+call.data+': day hour minute mess</b>,\nгде:\nday - день недели, например <i>понедельник</i>, <i>вторник</i> или <i>воскресенье</i>\nhour - час, например <i>06</i>, <i>14</i> или <i>22</i>\nminute - минута, например <i>04</i>, <i>12</i> или <i>36</i>\nmess - сообщение которое должен прислать бот', parse_mode = 'HTML')
				return

			if call.data == 'to a certain number':

				bot.send_message(call.message.chat.id, text = 'Вы выбрали тип напоминания "'+reminder_types[call.data]+'". Теперь введите команду в формате: <b>'+call.data+': number hour minute mess</b>,\nгде:\nnumber - число месяца, например <i>01</i>, <i>30</i> или <i>31</i>\nhour - час, например <i>06</i>, <i>14</i> или <i>22</i>\nminute - минута, например <i>04</i>, <i>12</i> или <i>36</i>\nmess - сообщение которое должен прислать бот', parse_mode = 'HTML')
				return

			if call.data == 'in a certain month':

				bot.send_message(call.message.chat.id, text = 'Вы выбрали тип напоминания "'+reminder_types[call.data]+'". Теперь введите команду в формате: <b>'+call.data+': month number hour minute mess</b>,\nгде:\nmonth - месяц, например <i>январь</i>, <i>апрель</i> или <i>май</i>\nnumber - число месяца, например <i>01</i>, <i>30</i> или <i>31</i>\nhour - час, например <i>06</i>, <i>14</i> или <i>22</i>\nminute - минута, например <i>04</i>, <i>12</i> или <i>36</i>\nmess - сообщение которое должен прислать бот', parse_mode = 'HTML')
				return

			if call.data == 'every few months':
				
				bot.send_message(call.message.chat.id, text = 'Вы выбрали тип напоминания "'+reminder_types[call.data]+'". Теперь введите команду в формате: <b>'+call.data+': number hour minute interval mess</b>,\nгде:\nnumber - число месяца, например <i>01</i>, <i>30</i> или <i>31</i>\nhour - час, например <i>06</i>, <i>14</i> или <i>22</i>\nminute - минута, например <i>04</i>, <i>12</i> или <i>36</i>\ninterval - интервал в месяцах, например <i>4</i>, <i>7</i> или <i>8</i>\nmess - сообщение которое должен прислать бот.\n\n<b>!!!</b> Будьте внимательны, number так же означает число месяца с которого начать отсчет сколько прошло интервалов (interval). Например сегодня 3 мая, а вы выставили число number в 5, а interval в 3,  это значит что только с 5 мая когда пройдет ровно 3 месяца в следующее 5 число (5 августа) сработает напоминание. Другой пример, если сегодня 1 сентября, а вы выставили число number в 31, а interval в 4,  это значит что только с 31 сентября когда пройдет ровно 4 месяца в следующее 31 число (31 января) сработает напоминание.', parse_mode = 'HTML')
				return

			if call.data == 'specific date':
				
				bot.send_message(call.message.chat.id, text = 'Вы выбрали тип напоминания "'+reminder_types[call.data]+'". Теперь введите команду в формате: <b>'+call.data+': month number hour minute mess</b>,\nгде:\nmonth - месяц, например <i>январь</i>, <i>апрель</i> или <i>май</i>\nnumber - число месяца, например <i>01</i>, <i>30</i> или <i>31</i>\nhour - час, например <i>06</i>, <i>14</i> или <i>22</i>\nminute - минута, например <i>04</i>, <i>12</i> или <i>36</i>\nmess - сообщение которое должен прислать бот', parse_mode = 'HTML')
				return

		@bot.message_handler(commands = ['start'])
		def get_start_message(message) -> None:

			if not message.chat.id in ids_auth_telegram_chats:
				bot.send_message(message.chat.id, '\U0001F512 Введите пожалуйста пароль')
			else: 
				bot.send_message(message.chat.id, 'С возвращением')

		@bot.message_handler(content_types = ['text'])
		def get_text_messages(message) -> None:
			
			global ids_auth_telegram_chats, reminders_list
					
			command_text = message.text.strip()

			if not message.chat.id in ids_auth_telegram_chats:
			
				if command_text == config_app['service_password']:

					lock_6.acquire()
					try:
						with open(install_dir+'/ids_auth_telegram_chats', 'a+', encoding = 'utf-8') as f:
							f.write(str(message.chat.id) + '\n')
					finally:
						lock_6.release()

					lock_5.acquire()
					try:
						ids_auth_telegram_chats.append(message.chat.id)
					finally:
						lock_5.release()

					button = telebot.types.ReplyKeyboardMarkup(True, False)
					button.row('≡ команды')
					bot.send_message(message.chat.id, '\U00002714 Авторизация прошла успешно', reply_markup = button)
					bot.send_message(message.chat.id, 'Давайте синхронизируем время, отправьте сегоднешнее число и время в формате d H:M, например <i>23 14:02</i>', parse_mode = 'HTML')
		
					if not os.path.exists(install_dir+'/reminders/'+str(message.chat.id)):
						os.mkdir(install_dir+'/reminders/'+str(message.chat.id))

				else:
					bot.send_message(message.chat.id, '\U000026D4 Пароль не верный')
			
				return

			if command_text == '/':

				button = telebot.types.ReplyKeyboardMarkup(True, False)
				button.row('≡ команды')
				bot.send_message(message.chat.id, '...', reply_markup = button)
				return

			if command_text == '≡ команды':

				button = telebot.types.ReplyKeyboardMarkup(True, False)
				button.row('•• все напоминания')
				button.row('+ добавить напоминание')
				button.row('« назад')
				bot.send_message(message.chat.id, '...', reply_markup = button)
				return
		
			if command_text == '« назад':

				button = telebot.types.ReplyKeyboardMarkup(True, False)
				button.row('≡ команды')
				bot.send_message(message.chat.id, '...', reply_markup = button)
				return

			if command_text == '•• все напоминания':

				if not message.chat.id in reminders_list or len(reminders_list[message.chat.id]) == 1:
					bot.send_message(message.chat.id, 'Не найдено ни одного напоминания')
					return

				for item in reminders_list:
					if item == message.chat.id:
						for idx, i in enumerate(reminders_list[item]):
							if idx > 0:
								text = '<u>Сообщение</u>: '+i['mess']+'\n<u>Тип</u>: '+reminder_types[i['type']]+'\n'
								if i['type'] == 'each hour':
									text += '<u>Минута</u>: '+str(i['minute'])
								if i['type'] == 'every few hours':
									text += '<u>Минута</u>: '+str(i['minute'])+'\n'
									text += '<u>Интервал</u>: '+str(i['interval'])
								if i['type'] == 'at a certain hour':
									text += '<u>Час</u>: '+str(i['hour'])+'\n'
									text += '<u>Минута</u>: '+str(i['minute'])+'\n'
								if i['type'] == 'every few days':
									text += '<u>Час</u>: '+str(i['hour'])+'\n'
									text += '<u>Минута</u>: '+str(i['minute'])+'\n'
									text += '<u>Интервал</u>: '+str(i['interval'])
								if i['type'] == 'at a certain day':
									text += '<u>День недели</u>: '+str(i['weekday'])+'\n'
									text += '<u>Час</u>: '+str(i['hour'])+'\n'
									text += '<u>Минута</u>: '+str(i['minute'])+'\n'
								if i['type'] == 'to a certain number':
									text += '<u>Число</u>: '+str(i['day'])+'\n'
									text += '<u>Час</u>: '+str(i['hour'])+'\n'
									text += '<u>Минута</u>: '+str(i['minute'])+'\n'
								if i['type'] == 'in a certain month':
									text += '<u>Месяц</u>: '+str(i['month'])+'\n'
									text += '<u>Число</u>: '+str(i['day'])+'\n'
									text += '<u>Час</u>: '+str(i['hour'])+'\n'
									text += '<u>Минута</u>: '+str(i['minute'])+'\n'
								if i['type'] == 'every few months':
									text += '<u>Число</u>: '+str(i['day'])+'\n'
									text += '<u>Час</u>: '+str(i['hour'])+'\n'
									text += '<u>Минута</u>: '+str(i['minute'])+'\n'
									text += '<u>Интервал</u>: '+str(i['interval'])+'\n'
								if i['type'] == 'specific date':
									text += '<u>Месяц</u>: '+str(i['month'])+'\n'
									text += '<u>Число</u>: '+str(i['day'])+'\n'
									text += '<u>Час</u>: '+str(i['hour'])+'\n'
									text += '<u>Минута</u>: '+str(i['minute'])+'\n'

								button = telebot.types.InlineKeyboardMarkup()
								button.add(telebot.types.InlineKeyboardButton(text = 'удалить', callback_data = 'delete_reminder:' + str(i['id'])))
								bot.send_message(message.chat.id, text = text, reply_markup = button, parse_mode = 'HTML')
						break

				return

			if command_text == '+ добавить напоминание':

				if not message.chat.id in reminders_list:
					bot.send_message(message.chat.id, 'Вы не отправили ваше сегоднешнее число и текущее время для синхронизации в формате d H:M, например <i>23 14:02</i>', parse_mode = 'HTML')
					return

				text = 'Выберите тип'

				button = telebot.types.InlineKeyboardMarkup()
				button.add(telebot.types.InlineKeyboardButton(text = 'каждый час', callback_data = 'each hour'))
				button.add(telebot.types.InlineKeyboardButton(text = 'раз в несколько часов', callback_data = 'every few hours'))
				button.add(telebot.types.InlineKeyboardButton(text = 'в определенный час', callback_data = 'at a certain hour'))
				button.add(telebot.types.InlineKeyboardButton(text = 'раз в несколько дней', callback_data = 'every few days'))
				button.add(telebot.types.InlineKeyboardButton(text = 'в определенный день', callback_data = 'at a certain day'))
				button.add(telebot.types.InlineKeyboardButton(text = 'в определенное число', callback_data = 'to a certain number'))
				button.add(telebot.types.InlineKeyboardButton(text = 'в определенный месяц', callback_data = 'in a certain month'))
				button.add(telebot.types.InlineKeyboardButton(text = 'раз в несколько месяцев', callback_data = 'every few months'))
				button.add(telebot.types.InlineKeyboardButton(text = 'определенная дата', callback_data = 'specific date'))

				bot.send_message(message.chat.id, text = text, reply_markup = button)
				
				return

			ex = re.split(r'^([0-9]+) +([0-9]+):([0-9]+)', command_text)
			if len(ex) > 3:
				
				day = int(ex[1])
				hour = int(ex[2])
				
				if day > 31:
					bot.send_message(message.chat.id, 'Вы указали некорректное время, сегоднешнее число не может быть более 31 ('+command_text+')')
					return

				if hour > 23:
					bot.send_message(message.chat.id, 'Вы указали некорректное время, час не может быть более 23 ('+command_text+')')
					return

				date = datetime.datetime.now().strftime('%d:%H:%M')
				ex = re.split(':', date)
				day_ = int(ex[0])
				hour_ = int(ex[1])
				hour_offset = 0
				symbol = '+'

				if hour > hour_:

					hour_offset = hour - hour_
					symbol = '+'

					if day > day_:
						hour_offset = 24 + hour_offset
						symbol = '+'
					elif day < day_:
						hour_offset = 24 - hour_offset
						symbol = '-'

				elif hour < hour_:

					hour_offset = hour_ - hour
					symbol = '-'

					if day > day_:
						hour_offset = (23 - hour_offset) + 1
						symbol = '+'
					elif day > day_:
						hour_offset = 24 + hour_offset
						symbol = '-'
				
				else:

					if day > day_:
						hour_offset = 24
						symbol = '+'
					elif day > day_:
						hour_offset = 24
						symbol = '-'

				lock_2.acquire()
				try:
					if not message.chat.id in reminders_list:
						reminders_list[message.chat.id] = [{'hour_offset':symbol + str(hour_offset)}]
					else:
						reminders_list[message.chat.id][0]['hour_offset'] = symbol + str(hour_offset)
				finally:
					lock_2.release()

				with open(install_dir+'/reminders/'+str(message.chat.id)+'/hour_offset', 'w+', encoding = 'utf-8') as f:
					f.write(symbol + str(hour_offset))

				bot.send_message(message.chat.id, 'Время принято')
				return

			ex = re.split(r'^each hour: +([0-9]+)( +(.*?))?$', command_text)
			if len(ex) > 2:
				
				minute = int(ex[1])
				mess = ex[3]
				if mess == None:
					mess = 'Напоминание "'+reminder_types['each hour']+'"'
				mess = mess.replace('"', '&#34;').replace("'", '&#39;')

				if minute > 59:
					bot.send_message(message.chat.id, 'Минута не может быть более 59')
					return

				if not message.chat.id in reminders_list:
					bot.send_message(message.chat.id, 'Вы не отправили ваше сегоднешнее число и текущее время для синхронизации в формате d H:M, например <i>23 14:02</i>', parse_mode = 'HTML')
					return

				id_ = random.randrange(10000, 65535)

				lock_2.acquire()
				try:
					reminders_list[message.chat.id].append({'id':id_, 'type':'each hour', 'minute':minute, 'mess':mess})
				finally:
					lock_2.release()
				
				text = '<u>Сообщение</u>: '+mess+'\n<u>Тип</u>: '+reminder_types['each hour']+'\n'
				text += '<u>Минута</u>: '+str(minute)

				button = telebot.types.InlineKeyboardMarkup()
				button.add(telebot.types.InlineKeyboardButton(text = 'удалить', callback_data = 'delete_reminder:' + str(id_)))
				bot.send_message(message.chat.id, text = text, reply_markup = button, parse_mode = 'HTML')

				update_reminders_list_in_file('add', message.chat.id, {'id':id_, 'type':'each hour', 'minute':minute, 'mess':mess})

				return

			ex = re.split(r'^every few hours: +([0-9]+) +([0-9]+)( +(.*?))?$', command_text)
			if len(ex) > 3:
				
				minute = int(ex[1])
				interval = int(ex[2])
				mess = ex[4]
				if mess == None:
					mess = 'Напоминание "'+reminder_types['every few hours']+'"'
				mess = mess.replace('"', '&#34;').replace("'", '&#39;')

				if minute > 59:
					bot.send_message(message.chat.id, 'Минута не может быть более 59')
					return

				if interval == 0:
					bot.send_message(message.chat.id, 'Интервал должен быть больше нуля')
					return

				if not message.chat.id in reminders_list:
					bot.send_message(message.chat.id, 'Вы не отправили ваше сегоднешнее число и текущее время для синхронизации в формате d H:M, например <i>23 14:02</i>', parse_mode = 'HTML')
					return

				id_ = random.randrange(10000, 65535)

				lock_2.acquire()
				try:
					reminders_list[message.chat.id].append({'id':id_, 'type':'every few hours', 'minute':minute, 'interval':interval, 'mess':mess})
				finally:
					lock_2.release()

				text = '<u>Сообщение</u>: '+mess+'\n<u>Тип</u>: '+reminder_types['every few hours']+'\n'
				text += '<u>Минута</u>: '+str(minute)+'\n'
				text += '<u>Интервал</u>: '+str(interval)

				button = telebot.types.InlineKeyboardMarkup()
				button.add(telebot.types.InlineKeyboardButton(text = 'удалить', callback_data = 'delete_reminder:' + str(id_)))
				bot.send_message(message.chat.id, text = text, reply_markup = button, parse_mode = 'HTML')

				update_reminders_list_in_file('add', message.chat.id, {'id':id_, 'type':'every few hours', 'minute':minute, 'interval':interval, 'mess':mess})

				return

			ex = re.split(r'^at a certain hour: +([0-9]+) +([0-9]+)( +(.*?))?$', command_text)
			if len(ex) > 3:

				hour = int(ex[1])
				minute = int(ex[2])
				mess = ex[4]
				if mess == None:
					mess = 'Напоминание "'+reminder_types['at a certain hour']+'"'
				mess = mess.replace('"', '&#34;').replace("'", '&#39;')

				if hour > 23:
					bot.send_message(message.chat.id, 'Час не может быть более 23')
					return

				if minute > 59:
					bot.send_message(message.chat.id, 'Минута не может быть более 59')
					return

				if not message.chat.id in reminders_list:
					bot.send_message(message.chat.id, 'Вы не отправили ваше сегоднешнее число и текущее время для синхронизации в формате d H:M, например <i>23 14:02</i>', parse_mode = 'HTML')
					return

				id_ = random.randrange(10000, 65535)

				lock_2.acquire()
				try:
					reminders_list[message.chat.id].append({'id':id_, 'type':'at a certain hour', 'hour':hour, 'minute':minute, 'mess':mess})
				finally:
					lock_2.release()

				text = '<u>Сообщение</u>: '+mess+'\n<u>Тип</u>: '+reminder_types['at a certain hour']+'\n'
				text += '<u>Час</u>: '+str(hour)+'\n'
				text += '<u>Минута</u>: '+str(minute)+'\n'

				button = telebot.types.InlineKeyboardMarkup()
				button.add(telebot.types.InlineKeyboardButton(text = 'удалить', callback_data = 'delete_reminder:' + str(id_)))
				bot.send_message(message.chat.id, text = text, reply_markup = button, parse_mode = 'HTML')

				update_reminders_list_in_file('add', message.chat.id, {'id':id_, 'type':'at a certain hour', 'hour':hour, 'minute':minute, 'mess':mess})

				return

			ex = re.split(r'^every few days: +([0-9]+) +([0-9]+) +([0-9]+)( +(.*?))?$', command_text)
			if len(ex) > 4:

				hour = int(ex[1])
				minute = int(ex[2])
				interval = int(ex[3])
				mess = ex[5]
				if mess == None:
					mess = 'Напоминание "'+reminder_types['every few days']+'"'
				mess = mess.replace('"', '&#34;').replace("'", '&#39;')

				if hour > 23:
					bot.send_message(message.chat.id, 'Час не может быть более 23')
					return

				if minute > 59:
					bot.send_message(message.chat.id, 'Минута не может быть более 59')
					return
					
				if interval == 0:
					bot.send_message(message.chat.id, 'Интервал должен быть больше нуля')
					return

				if not message.chat.id in reminders_list:
					bot.send_message(message.chat.id, 'Вы не отправили ваше сегоднешнее число и текущее время для синхронизации в формате d H:M, например <i>23 14:02</i>', parse_mode = 'HTML')
					return

				id_ = random.randrange(10000, 65535)

				lock_2.acquire()
				try:
					reminders_list[message.chat.id].append({'id':id_, 'type':'every few days', 'hour':hour, 'minute':minute, 'interval':interval, 'mess':mess})
				finally:
					lock_2.release()

				text = '<u>Сообщение</u>: '+mess+'\n<u>Тип</u>: '+reminder_types['every few days']+'\n'
				text += '<u>Час</u>: '+str(hour)+'\n'
				text += '<u>Минута</u>: '+str(minute)+'\n'
				text += '<u>Интервал</u>: '+str(interval)

				button = telebot.types.InlineKeyboardMarkup()
				button.add(telebot.types.InlineKeyboardButton(text = 'удалить', callback_data = 'delete_reminder:' + str(id_)))
				bot.send_message(message.chat.id, text = text, reply_markup = button, parse_mode = 'HTML')

				update_reminders_list_in_file('add', message.chat.id, {'id':id_, 'type':'every few days', 'hour':hour, 'minute':minute, 'interval':interval, 'mess':mess})

				return
			
			ex = re.split(r'^at a certain day: +([а-яА-Я]+) +([0-9]+) +([0-9]+)( +(.*?))?$', command_text)
			if len(ex) > 4:

				weekday = ex[1].lower()
				hour = int(ex[2])
				minute = int(ex[3])
				mess = ex[5]
				if mess == None:
					mess = 'Напоминание "'+reminder_types['at a certain day']+'"'
				mess = mess.replace('"', '&#34;').replace("'", '&#39;')

				if not weekday in weekdays:
					bot.send_message(message.chat.id, 'Такой день недели не известен ('+weekday+')')
					return	

				if hour > 23:
					bot.send_message(message.chat.id, 'Час не может быть более 23')
					return

				if minute > 59:
					bot.send_message(message.chat.id, 'Минута не может быть более 59')
					return

				if not message.chat.id in reminders_list:
					bot.send_message(message.chat.id, 'Вы не отправили ваше сегоднешнее число и текущее время для синхронизации в формате d H:M, например <i>23 14:02</i>', parse_mode = 'HTML')
					return

				id_ = random.randrange(10000, 65535)

				lock_2.acquire()
				try:
					reminders_list[message.chat.id].append({'id':id_, 'type':'at a certain day', 'weekday':weekday, 'hour':hour, 'minute':minute, 'mess':mess})
				finally:
					lock_2.release()

				text = '<u>Сообщение</u>: '+mess+'\n<u>Тип</u>: '+reminder_types['at a certain day']+'\n'
				text += '<u>День недели</u>: '+weekday+'\n'
				text += '<u>Час</u>: '+str(hour)+'\n'
				text += '<u>Минута</u>: '+str(minute)+'\n'

				button = telebot.types.InlineKeyboardMarkup()
				button.add(telebot.types.InlineKeyboardButton(text = 'удалить', callback_data = 'delete_reminder:' + str(id_)))
				bot.send_message(message.chat.id, text = text, reply_markup = button, parse_mode = 'HTML')

				update_reminders_list_in_file('add', message.chat.id, {'id':id_, 'type':'at a certain day', 'weekday':weekday, 'hour':hour, 'minute':minute, 'mess':mess})

				return

			ex = re.split(r'^to a certain number: +([0-9]+) +([0-9]+) +([0-9]+)( +(.*?))?$', command_text)
			if len(ex) > 4:

				day = int(ex[1])
				hour = int(ex[2])
				minute = int(ex[3])
				mess = ex[5]
				if mess == None:
					mess = 'Напоминание "'+reminder_types['to a certain number']+'"'
				mess = mess.replace('"', '&#34;').replace("'", '&#39;')

				if day > 31:
					bot.send_message(message.chat.id, 'Число месяца не может быть более 31')
					return	

				if hour > 23:
					bot.send_message(message.chat.id, 'Час не может быть более 23')
					return

				if minute > 59:
					bot.send_message(message.chat.id, 'Минута не может быть более 59')
					return

				if not message.chat.id in reminders_list:
					bot.send_message(message.chat.id, 'Вы не отправили ваше сегоднешнее число и текущее время для синхронизации в формате d H:M, например <i>23 14:02</i>', parse_mode = 'HTML')
					return

				id_ = random.randrange(10000, 65535)

				lock_2.acquire()
				try:
					reminders_list[message.chat.id].append({'id':id_, 'type':'to a certain number', 'day':day, 'hour':hour, 'minute':minute, 'mess':mess})
				finally:
					lock_2.release()

				text = '<u>Сообщение</u>: '+mess+'\n<u>Тип</u>: '+reminder_types['to a certain number']+'\n'
				text += '<u>Число</u>: '+str(day)+'\n'
				text += '<u>Час</u>: '+str(hour)+'\n'
				text += '<u>Минута</u>: '+str(minute)+'\n'

				button = telebot.types.InlineKeyboardMarkup()
				button.add(telebot.types.InlineKeyboardButton(text = 'удалить', callback_data = 'delete_reminder:' + str(id_)))
				bot.send_message(message.chat.id, text = text, reply_markup = button, parse_mode = 'HTML')

				update_reminders_list_in_file('add', message.chat.id, {'id':id_, 'type':'to a certain number', 'day':day, 'hour':hour, 'minute':minute, 'mess':mess})

				return

			ex = re.split(r'^in a certain month: +([а-яА-Я]+) +([0-9]+) +([0-9]+) +([0-9]+)( +(.*?))?$', command_text)
			if len(ex) > 5:
				
				month = ex[1].lower()
				day = int(ex[2])
				hour = int(ex[3])
				minute = int(ex[4])
				mess = ex[6]
				if mess == None:
					mess = 'Напоминание "'+reminder_types['in a certain month']+'"'
				mess = mess.replace('"', '&#34;').replace("'", '&#39;')

				if not month in months:
					bot.send_message(message.chat.id, 'Такой месяц не известен ('+month+')')
					return	

				if day > 31:
					bot.send_message(message.chat.id, 'Число месяца не может быть более 31')
					return	

				if hour > 23:
					bot.send_message(message.chat.id, 'Час не может быть более 23')
					return

				if minute > 59:
					bot.send_message(message.chat.id, 'Минута не может быть более 59')
					return

				if not message.chat.id in reminders_list:
					bot.send_message(message.chat.id, 'Вы не отправили ваше сегоднешнее число и текущее время для синхронизации в формате d H:M, например <i>23 14:02</i>', parse_mode = 'HTML')
					return

				id_ = random.randrange(10000, 65535)

				lock_2.acquire()
				try:
					reminders_list[message.chat.id].append({'id':id_, 'type':'in a certain month', 'month':month, 'day':day, 'hour':hour, 'minute':minute, 'mess':mess})
				finally:
					lock_2.release()

				text = '<u>Сообщение</u>: '+mess+'\n<u>Тип</u>: '+reminder_types['in a certain month']+'\n'
				text += '<u>Месяц</u>: '+str(month)+'\n'
				text += '<u>Число</u>: '+str(day)+'\n'
				text += '<u>Час</u>: '+str(hour)+'\n'
				text += '<u>Минута</u>: '+str(minute)+'\n'

				button = telebot.types.InlineKeyboardMarkup()
				button.add(telebot.types.InlineKeyboardButton(text = 'удалить', callback_data = 'delete_reminder:' + str(id_)))
				bot.send_message(message.chat.id, text = text, reply_markup = button, parse_mode = 'HTML')

				update_reminders_list_in_file('add', message.chat.id, {'id':id_, 'type':'in a certain month', 'month':month, 'day':day, 'hour':hour, 'minute':minute, 'mess':mess})

				return

			ex = re.split(r'^every few months: +([0-9]+) +([0-9]+) +([0-9]+) +([0-9]+)( +(.*?))?$', command_text)
			if len(ex) > 5:

				day = int(ex[1])
				hour = int(ex[2])
				minute = int(ex[3])
				interval = int(ex[4])
				mess = ex[6]
				if mess == None:
					mess = 'Напоминание "'+reminder_types['every few months']+'"'
				mess = mess.replace('"', '&#34;').replace("'", '&#39;')

				if day > 31:
					bot.send_message(message.chat.id, 'Число месяца не может быть более 31')
					return

				if hour > 23:
					bot.send_message(message.chat.id, 'Час не может быть более 23')
					return

				if minute > 59:
					bot.send_message(message.chat.id, 'Минута не может быть более 59')
					return
					
				if interval == 0:
					bot.send_message(message.chat.id, 'Интервал должен быть больше нуля')
					return

				if not message.chat.id in reminders_list:
					bot.send_message(message.chat.id, 'Вы не отправили ваше сегоднешнее число и текущее время для синхронизации в формате d H:M, например <i>23 14:02</i>', parse_mode = 'HTML')
					return

				id_ = random.randrange(10000, 65535)

				lock_2.acquire()
				try:
					reminders_list[message.chat.id].append({'id':id_, 'type':'every few months', 'day':day, 'hour':hour, 'minute':minute, 'interval':interval, 'mess':mess})
				finally:
					lock_2.release()

				text = '<u>Сообщение</u>: '+mess+'\n<u>Тип</u>: '+reminder_types['every few months']+'\n'
				text += '<u>Число</u>: '+str(day)+'\n'
				text += '<u>Час</u>: '+str(hour)+'\n'
				text += '<u>Минута</u>: '+str(minute)+'\n'
				text += '<u>Интервал</u>: '+str(interval)+'\n'

				button = telebot.types.InlineKeyboardMarkup()
				button.add(telebot.types.InlineKeyboardButton(text = 'удалить', callback_data = 'delete_reminder:' + str(id_)))
				bot.send_message(message.chat.id, text = text, reply_markup = button, parse_mode = 'HTML')

				update_reminders_list_in_file('add', message.chat.id, {'id':id_, 'type':'every few months', 'day':day, 'hour':hour, 'minute':minute, 'interval':interval, 'mess':mess})

				return

			ex = re.split(r'^specific date: +([а-яА-Я]+) +([0-9]+) +([0-9]+) +([0-9]+)( +(.*?))?$', command_text)
			if len(ex) > 5:
				
				month = ex[1].lower()
				day = int(ex[2])
				hour = int(ex[3])
				minute = int(ex[4])
				mess = ex[6]
				if mess == None:
					mess = 'Напоминание "'+reminder_types['specific date']+'"'
				mess = mess.replace('"', '&#34;').replace("'", '&#39;')
				
				if not month in months:
					bot.send_message(message.chat.id, 'Такой месяц не известен ('+month+')')
					return	

				if day > 31:
					bot.send_message(message.chat.id, 'Число месяца не может быть более 31')
					return	

				if hour > 23:
					bot.send_message(message.chat.id, 'Час не может быть более 23')
					return

				if minute > 59:
					bot.send_message(message.chat.id, 'Минута не может быть более 59')
					return

				if not message.chat.id in reminders_list:
					bot.send_message(message.chat.id, 'Вы не отправили ваше сегоднешнее число и текущее время для синхронизации в формате d H:M, например <i>23 14:02</i>', parse_mode = 'HTML')
					return

				id_ = random.randrange(10000, 65535)

				lock_2.acquire()
				try:
					reminders_list[message.chat.id].append({'id':id_, 'type':'specific date', 'month':month, 'day':day, 'hour':hour, 'minute':minute, 'mess':mess})
				finally:
					lock_2.release()

				text = '<u>Сообщение</u>: '+mess+'\n<u>Тип</u>: '+reminder_types['specific date']+'\n'
				text += '<u>Месяц</u>: '+str(month)+'\n'
				text += '<u>Число</u>: '+str(day)+'\n'
				text += '<u>Час</u>: '+str(hour)+'\n'
				text += '<u>Минута</u>: '+str(minute)+'\n'

				button = telebot.types.InlineKeyboardMarkup()
				button.add(telebot.types.InlineKeyboardButton(text = 'удалить', callback_data = 'delete_reminder:' + str(id_)))
				bot.send_message(message.chat.id, text = text, reply_markup = button, parse_mode = 'HTML')

				update_reminders_list_in_file('add', message.chat.id, {'id':id_, 'type':'specific date', 'month':month, 'day':day, 'hour':hour, 'minute':minute, 'mess':mess})

				return

			bot.send_message(message.chat.id, 'Неизвестная команда')

		bot.polling(none_stop = True, interval = 0)
	
	except telebot.apihelper.ApiException as err:

		try:
			bot.stop_bot()
		except Exception:
			pass

		log_other_error(err)
		threading.Thread(target = restart_telegram_bot, args = ()).start()
	
	except Exception:
		
		try:
			bot.stop_bot()
		except Exception:
			pass
		
		err = traceback.format_exc().strip()

		if not 'The read operation timed out' in err and not 'Read timed out.' in err:
			log_other_error(err)
	
		threading.Thread(target = restart_telegram_bot, args = ()).start()

def restart_telegram_bot() -> None:
	time.sleep(5)
	threading.Thread(target = telegram_bot, args = ()).start()

def update_reminders_list_in_file(act : str, message_chat_id : int, data : dict) -> None:
	
	try:
		
		if act == 'delete':

			with open(install_dir+'/reminders/'+str(message_chat_id)+'/list', 'r+', encoding = 'utf-8') as f:
				text = f.read()
				text = re.sub(r'id:' + str(data['id']) + '.+' + '\n', '', text)
				f.truncate(0)
				with open(install_dir+'/reminders/'+str(message_chat_id)+'/list', 'a+', encoding = 'utf-8') as f:
					f.write(text)

		if act == 'add':

			text = ''

			for item in data:
				text += item + ':' + str(data[item]) + '|'
			text += 'conf:' + '\n'

			with open(install_dir+'/reminders/'+str(message_chat_id)+'/list', 'a+', encoding = 'utf-8') as f:
				f.write(text)

		if act == 'update':
			
			id_ = str(data['id'])
			data.pop('id')

			with open(install_dir+'/reminders/'+str(message_chat_id)+'/list', 'r+', encoding = 'utf-8') as f:
				text = f.read()
				text = re.sub(r'(id:' + id_ + '.*?\|conf:).*' + '\n', r'\1'+str(data) + '\n', text)
				f.truncate(0)
				with open(install_dir+'/reminders/'+str(message_chat_id)+'/list', 'a+', encoding = 'utf-8') as f:
					f.write(text)

	except Exception:
		log_other_error(traceback.format_exc().strip())

def check_time_reminders() -> None:

	global results_for_telegram, reminders_list

	try:

		while True:

			date = datetime.datetime.now().strftime('%d:%m:%Y:%H:%M')
			ex = re.split(':', date)
			
			weekday_ = datetime.datetime.today().weekday()
			day_ = int(ex[0])
			month_ = int(ex[1])
			year_ = int(ex[2])
			hour_ = int(ex[3])
			minute_ = int(ex[4])

			lock_2.acquire()
			try:
				reminders_list_ = copy.deepcopy(reminders_list)
			finally:
				lock_2.release()

			for item in reminders_list_:
				for idx, i in enumerate(reminders_list_[item]):

					if idx == 0:

						ex = re.split(r'(\+|\-)([0-9]+)', i['hour_offset'])
						symbol = ex[1]
						hour = int(ex[2])

						if symbol == '+':
							hour_ += hour
						else:
							hour_ -= hour

						if hour_ > 23:
							hour_ = 24 - hour_
							weekday_ += 1
							if weekday_ == 7:
								weekday_ = 0
							day_ += 1
							if day_ == 29 and month_ == 2 and not year_ in list_leap_years:
								day_ = 1
								month_ += 1
							if day_ == 31 and month_ != 1 and month_ != 3 and month_ != 5 and month_ != 7 and month_ != 8 and month_ != 10 and month_ != 12:
								day_ = 1
								month_ += 1
								if month_ == 13:
									month_ = 1

						if hour_ < 0:
							hour_ = 24 - (hour_ * -1)
							weekday_ -= 1
							if weekday_ == -1:
								weekday_ = 6
							day_ -= 1
							if day_ == 0:
								month_ -= 1
								if month_ == 0:
									month_ = 12
								day_ = months2[month_]
								if year_ in list_leap_years and month_ == 2:
									day_ = 29

					else:

						if i['type'] == 'each hour':

							if i['minute'] == minute_:

								lock_4.acquire()
								try:
									results_for_telegram.append({'message_chat_id':item, 'type':i['type'], 'mess':i['mess']})
								finally:
									lock_4.release()

						if i['type'] == 'every few hours':
							
							is_found = False

							if not 'timestamp' in i:

								timestamp = time.time()
								count = 0

								lock_2.acquire()
								try:
									for idx_, y in enumerate(reminders_list[item]):
										if idx_ > 0:
											if y['id'] == i['id']:
												y['timestamp'] = timestamp
												y['count'] = count
												is_found = True
												break
								finally:
									lock_2.release()

								i['timestamp'] = timestamp
								i['count'] = count

							if time.time() - i['timestamp'] >= 3600:

								timestamp = time.time()
								count = 0

								lock_2.acquire()
								try:
									for idx_, y in enumerate(reminders_list[item]):
										if idx_ > 0:
											if y['id'] == i['id']:
												y['timestamp'] = timestamp
												y['count'] += 1
												count = y['count']
												is_found = True
												break
								finally:
									lock_2.release()

								if is_found:
									i['timestamp'] = timestamp
									i['count'] = count

							if i['count'] == i['interval'] and i['minute'] == minute_:

								timestamp = time.time()
								count = 0

								lock_2.acquire()
								try:
									for idx_, y in enumerate(reminders_list[item]):
										if idx_ > 0:
											if y['id'] == i['id']:
												y['timestamp'] = timestamp
												y['count'] = count
												is_found = True
												break
								finally:
									lock_2.release()
							
								if is_found:
									i['timestamp'] = timestamp
									i['count'] = count

								lock_4.acquire()
								try:
									results_for_telegram.append({'message_chat_id':item, 'type':i['type'], 'mess':i['mess']})
								finally:
									lock_4.release()

							if is_found:
								update_reminders_list_in_file('update', item, {'id':i['id'], 'timestamp':timestamp, 'count':count})

						if i['type'] == 'at a certain hour':

							if i['hour'] == hour_ and i['minute'] == minute_:

								lock_4.acquire()
								try:
									results_for_telegram.append({'message_chat_id':item, 'type':i['type'], 'mess':i['mess']})
								finally:
									lock_4.release()

						if i['type'] == 'every few days':
							
							is_found = False

							if not 'timestamp' in i:

								timestamp = time.time()
								count = 0

								lock_2.acquire()
								try:
									for idx_, y in enumerate(reminders_list[item]):
										if idx_ > 0:
											if y['id'] == i['id']:
												y['timestamp'] = timestamp
												y['count'] = count
												is_found = True
												break
								finally:
									lock_2.release()

								i['timestamp'] = timestamp
								i['count'] = count

							if time.time() - i['timestamp'] >= 86400:

								timestamp = time.time()
								count = 0

								lock_2.acquire()
								try:
									for idx_, y in enumerate(reminders_list[item]):
										if idx_ > 0:
											if y['id'] == i['id']:
												y['timestamp'] = timestamp
												y['count'] += 1
												count = y['count']
												is_found = True
												break
								finally:
									lock_2.release()

								if is_found:
									i['timestamp'] = timestamp
									i['count'] = count

							if i['count'] == i['interval'] and i['hour'] == hour_ and i['minute'] == minute_:
								
								timestamp = time.time()
								count = 0

								lock_2.acquire()
								try:
									for idx_, y in enumerate(reminders_list[item]):
										if idx_ > 0:
											if y['id'] == i['id']:
												y['timestamp'] = timestamp
												y['count'] = count
												is_found = True
												break
								finally:
									lock_2.release()

								if is_found:
									i['timestamp'] = timestamp
									i['count'] = count

								lock_4.acquire()
								try:
									results_for_telegram.append({'message_chat_id':item, 'type':i['type'], 'mess':i['mess']})
								finally:
									lock_4.release()

							if is_found:
								update_reminders_list_in_file('update', item, {'id':i['id'], 'timestamp':timestamp, 'count':count})

						if i['type'] == 'at a certain day':
							
							if weekdays[i['weekday']] == weekday_ and i['hour'] == hour_ and i['minute'] == minute_:

								lock_4.acquire()
								try:
									results_for_telegram.append({'message_chat_id':item, 'type':i['type'], 'mess':i['mess']})
								finally:
									lock_4.release()

						if i['type'] == 'to a certain number':
							
							if i['day'] == day_ and i['hour'] == hour_ and i['minute'] == minute_:

								lock_4.acquire()
								try:
									results_for_telegram.append({'message_chat_id':item, 'type':i['type'], 'mess':i['mess']})
								finally:
									lock_4.release()

						if i['type'] == 'in a certain month':
							
							if months3[i['month']] == month_ and i['day'] == day_ and i['hour'] == hour_ and i['minute'] == minute_:

								lock_4.acquire()
								try:
									results_for_telegram.append({'message_chat_id':item, 'type':i['type'], 'mess':i['mess']})
								finally:
									lock_4.release()

						if i['type'] == 'every few months':
							
							is_found = False

							if not 'current_date' in i:

								current_date = ''
								count = -1

								lock_2.acquire()
								try:
									for idx_, y in enumerate(reminders_list[item]):
										if idx_ > 0:
											if y['id'] == i['id']:
												y['current_date'] = current_date
												y['count'] = count
												is_found = True
												break
								finally:
									lock_2.release()

								i['current_date'] = current_date
								i['count'] = count

							if (i['current_date'] != str(day_) + ' ' + str(month_) + ' ' + str(year_)) and ((i['day'] == day_) or (i['day'] > 28 and day_ == 1 and month_ == 3)):

								current_date = str(day_) + ' ' + str(month_) + ' ' + str(year_)
								count = 0

								lock_2.acquire()
								try:
									for idx_, y in enumerate(reminders_list[item]):
										if idx_ > 0:
											if y['id'] == i['id']:
												y['current_date'] = current_date
												y['count'] += 1
												count = y['count']
												is_found = True
												break
								finally:
									lock_2.release()
								
								if is_found:
									i['current_date'] = current_date
									i['count'] = count

							if i['count'] == i['interval'] and i['hour'] == hour_ and i['minute'] == minute_:

								current_date = ''
								count = -1

								lock_2.acquire()
								try:
									for idx_, y in enumerate(reminders_list[item]):
										if idx_ > 0:
											if y['id'] == i['id']:
												y['current_date'] = current_date
												y['count'] = count
												is_found = True
												break
								finally:
									lock_2.release()
							
								if is_found:
									i['current_date'] = current_date
									i['count'] = count

								lock_4.acquire()
								try:
									results_for_telegram.append({'message_chat_id':item, 'type':i['type'], 'mess':i['mess']})
								finally:
									lock_4.release()

							if is_found:
								update_reminders_list_in_file('update', item, {'id':i['id'], 'current_date':current_date, 'count':count})

						if i['type'] == 'specific date':
							
							if months3[i['month']] == month_ and i['day'] == day_ and i['hour'] == hour_ and i['minute'] == minute_:
			
								lock_4.acquire()
								try:
									results_for_telegram.append({'message_chat_id':item, 'type':i['type'], 'mess':i['mess']})
								finally:
									lock_4.release()

								lock_2.acquire()
								try:
									for idx_, y in enumerate(reminders_list[item]):
										if idx_ > 0:
											if y['id'] == i['id']:
												reminders_list[item].pop(idx_)
												break
								finally:
									lock_2.release()

								update_reminders_list_in_file('delete', item, {'id':i['id']})

			time.sleep(60)

	except Exception:
		log_other_error(traceback.format_exc().strip())

def run() -> None:
	
	try:
		
		print('reminder_app v'+app_version)
		print('[Info] launching application ...')
		
		threading.Thread(target = telegram_bot, args = ()).start()
		threading.Thread(target = check_time_reminders, args = ()).start()
		threading.Thread(target = distribution_of_results_for_telegram, args = ()).start()

	except Exception:
		log_other_error(traceback.format_exc().strip())

if __name__ == '__main__':

	install_dir = re.sub(r'/[^/]+$', '', os.path.abspath(__file__).replace(u'\\', u'/'))
	preparing_and_checking_files()
	run()




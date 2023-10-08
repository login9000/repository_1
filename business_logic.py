# -*- coding: utf-8 -*-

import re
import os
import sys
import datetime
import asyncio
import traceback
from aiogram import types # pip3 install aiogram
from aiogram.utils import exceptions
from typing import Union
import json
import copy
import pymysql # pip3 install PyMySQL          pip3 install PyMySQL[rsa]
from pymysql.cursors import DictCursor
import time


lock_1 = asyncio.Lock()
lock_2 = asyncio.Lock()
lock_3 = asyncio.Lock()

class Business_logic():

	version = '3.7'
	install_dir = ''
	config_app = {}
	users = {}
	default_conf = {'timezone':'-', 'conf':{}}
	mysql_connections = [None]
	weekdays = {'monday':0, 'tuesday':1, 'wednesday':2, 'thursday':3, 'friday':4, 'saturday':5, 'sunday':6}
	leap_years = [2020, 2024, 2028, 2032, 2036, 2040, 2044, 2048, 2052, 2056, 2060, 2064, 2068, 2072, 2076, 2080, 2084, 2088, 2092, 2096]
	months2 = {1:31, 2:28, 3:31, 4:30, 5:31, 6:30, 7:31, 8:31, 9:30, 10:31, 11:30, 12:31}
	months3 = {'january':1, 'february':2, 'march':3, 'april':4, 'may':5, 'june':6, 'july':7, 'august':8, 'september':9, 'october':10, 'november':11, 'december':12}
	server_timezone = int(re.sub('0([0-9]{1})', r'\1', re.sub('.+((\+|\-)[0-9]{2}):[0-9]{2}$', r'\1', datetime.datetime.now().astimezone()
.isoformat())))
	tg_bot = None
	default_text_other_err = '⚠️ An unexpected error occurred, please try again later'
	default_text_auth_err = '⚠️ An unexpected error occurred. Restart the application'

	def __init__(self, tg_bot : object, config_app : dict) -> None:

		self.install_dir = re.sub(r'/[^/]+$', '', os.path.abspath(__file__).replace(u'\\', u'/'))
		self.tg_bot = tg_bot
		self.config_app = config_app
		self.connection_to_mysql()
		self.create_tables_if_no_exists() # create all the necessary tables

	async def log_other_error(self, mess) -> None:

		async with lock_1:

			if mess:

				line = sys._getframe(1).f_lineno

				date = datetime.datetime.now().strftime('%d-%m-%Y %H:%M:%S')
				mess = date+' (line:'+str(line)+') '+str(mess) + '\n'+'----------------------------------------------------------------------------------------' + '\n'
				
				with open(self.install_dir+'/other_errors.log', 'a+', encoding = 'utf-8') as f:
					f.write(mess)

	async def log_js_error(self, mess : str, path : str, file : str, lineno : str) -> None:

		async with lock_3:

			if mess:
				
				mess = self.remove_bad_symbol(mess, False)
				path = self.remove_bad_symbol(path, False)
				file = self.remove_bad_symbol(file, False)
				lineno = self.remove_bad_symbol(lineno, False)

				date = datetime.datetime.now().strftime('%d-%m-%Y %H:%M:%S')
				mess = date+'|'+mess+'|'+path+'|'+file+'|'+lineno+'|\n'+'----------------------------------------------------------------------------------------' + '\n'
				
				with open(self.install_dir+'/js_errors.log', 'a+', encoding = 'utf-8') as f:
					f.write(mess)

	def connection_to_mysql(self) -> None:
		
		if self.mysql_connections[0] == None or not self.mysql_connections[0].open:
		
			try:
				
				self.mysql_connections[0] = pymysql.connect(host = self.config_app['db_host'], port = self.config_app['db_port'], user = self.config_app['db_username'],	password = self.config_app['db_password'],	db = self.config_app['db_database'],	charset = 'utf8mb4',	cursorclass = DictCursor)
			
			except pymysql.Error as err:
				
				err = str(err.args[1])
				print(f'[Error] {err}')
				sys.exit(1)

	def create_tables_if_no_exists(self) -> None:

		with self.mysql_connections[0].cursor() as cursor:
			cursor.execute('SHOW TABLES LIKE \'users\'')
			rows = cursor.fetchall()

			if len(rows) == 0:
				cursor.execute(f'''
				CREATE TABLE `{self.config_app['users_table_name']}` (
					`id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, 
					`user_id` char(15) NOT NULL DEFAULT '', 
					`timezone` char(4) NOT NULL DEFAULT '-'
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
				''')
				cursor.execute('ALTER TABLE `'+self.config_app['users_table_name']+'` ADD KEY `user_id_index` (`user_id`) USING BTREE')
				self.mysql_connections[0].commit()

	async def get_start_message(self, message : str) -> None:
		
		try:

			user_id = str(message.chat.id)

			if not user_id in self.users:

				result, err = await self.query_db('add_user', {'user_id':user_id})
				if err:
					try:
						await message.answer(self.default_text_other_err)
					except exceptions.BotBlocked:
						await self.delete_user(user_id)
					except exceptions.ChatNotFound:
						await self.delete_user(user_id)	
					await self.log_other_error(err)
					await self.report_error_to_admin(err)
					return
	
				async with lock_2:
					self.users[user_id] = self.default_conf

			keyboard = types.InlineKeyboardMarkup()
			keyboard.add(types.InlineKeyboardButton(text = 'open', web_app = types.WebAppInfo(url = self.config_app['url_webapp'])))

			text = f'Hello {message.chat.first_name}, click the button below to get started'
			if user_id == self.config_app['admin_id']:
				text = f'Hello Administrator {message.chat.first_name}, click the button below to get started'
			
			try:
				await message.answer(text, reply_markup = keyboard)
			except exceptions.BotBlocked:
				await self.delete_user(user_id)
			except exceptions.ChatNotFound:
				await self.delete_user(user_id)

		except Exception:
			await self.log_other_error(traceback.format_exc().strip())
	
	def remove_bad_symbol(self, text : str, is_replace_specsymbol_to_space : bool = True) -> str:

		text = text.replace('`', '&#96;').replace('\\', '&#092;').replace('­', '-').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;').replace("'", '&#39;')
		if is_replace_specsymbol_to_space:
			text = re.sub(r'\r\n|\r|\n|\t|\0|\00|\f|\b', ' ', text)
		return text

	def message_filtering(self, text : str) -> str:
		return text[:512].replace('\\', '&#092;').replace('\n', '\\n').replace('\r', '\\r').replace('\r\n', '\\r\\n').replace('\0', '\\0').replace('\00', '\\00').replace('\f', '').replace('`', '&#96;').replace('­', '-').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;').replace("'", '&#39;')

	def _add_user(self, data : dict) -> list:

		try:

			user_id = str(data['user_id'])

			with self.mysql_connections[0].cursor() as cursor:
				cursor.execute('INSERT INTO `'+self.config_app['users_table_name']+'` (`user_id`) VALUES (%s)', (user_id))
			self.mysql_connections[0].commit()

			return [True, None]

		except Exception:

			err = traceback.format_exc().strip()
			return [None, err]

	def _delete_user(self, data : dict) -> list:

		try:
			
			user_id = str(data['user_id'])

			with self.mysql_connections[0].cursor() as cursor:

				cursor.execute('DELETE FROM `'+self.config_app['users_table_name']+'` WHERE `user_id` = %s LIMIT 1', (user_id))
				self.mysql_connections[0].commit()

				try:

					cursor.execute('DROP TABLE `users_conf_'+user_id+'`')
					self.mysql_connections[0].commit()

				except pymysql.Error as err:

					err = str(err.args[1])
					if not 'Unknown table' in err:
						return [None, err]

			return [True, None]

		except Exception:

			err = traceback.format_exc().strip()
			return [None, err]

	def _save_timezone(self, data : dict) -> list:

		try:

			user_id = str(data['user_id'])
			timezone = str(data['timezone'])

			with self.mysql_connections[0].cursor() as cursor:

				try:

					cursor.execute('UPDATE `'+self.config_app['users_table_name']+'` SET `timezone` = %s WHERE `user_id` = %s LIMIT 1', (timezone, user_id))
					self.mysql_connections[0].commit()

				except pymysql.Error as err:

					err = str(err.args[1])
					return [None, err]		

			return [True, None]

		except Exception:

			err = traceback.format_exc().strip()
			return [None, err]

	def _update_timestamp_and_count(self, data : dict) -> list:

		try:

			user_id = str(data['user_id'])
			id_ = int(data['id'])
			timestamp = data['timestamp']
			count = data['count']

			with self.mysql_connections[0].cursor() as cursor:

				try:
					cursor.execute('SELECT `conf` FROM `users_conf_'+user_id+'` WHERE `id` = %s LIMIT 1', (id_))
				except pymysql.Error as err:
					err = str(err.args[1])
					return [None, err]

				rows = cursor.fetchall()

				for row in rows:

					if '"timestamp"' in row['conf']:
						conf = re.sub('"timestamp":[0-9]+', '"timestamp":'+str(timestamp), row['conf'])
						conf = re.sub('"count":[0-9]+', '"count":'+str(count), conf)
					else:
						conf = re.sub('\}$', ', "timestamp":'+str(timestamp)+', "count":'+str(count)+'}', row['conf'])

				try:

					cursor.execute('UPDATE `users_conf_'+user_id+'` SET `conf` = %s WHERE `id` = %s LIMIT 1', (conf, id_))
					self.mysql_connections[0].commit()

				except pymysql.Error as err:

					err = str(err.args[1])
					return [None, err]
	
			return [True, None]

		except Exception:

			err = traceback.format_exc().strip()
			return [None, err]

	def _update_current_date_and_count(self, data : dict) -> list:

		try:

			user_id = str(data['user_id'])
			id_ = int(data['id'])
			current_date = data['current_date']
			count = data['count']

			with self.mysql_connections[0].cursor() as cursor:

				try:
					cursor.execute('SELECT `conf` FROM `users_conf_'+user_id+'` WHERE `id` = %s LIMIT 1', (id_))
				except pymysql.Error as err:
					err = str(err.args[1])
					return [None, err]

				rows = cursor.fetchall()

				for row in rows:

					if '"current_date"' in row['conf']:
						conf = re.sub('"current_date":"[^"]*"', '"current_date":"'+current_date+'"', row['conf'])
						conf = re.sub('"count":[0-9]+', '"count":'+str(count), conf)
					else:
						conf = re.sub('\}$', ', "current_date":"'+current_date+'", "count":'+str(count)+'}', row['conf'])

				try:

					cursor.execute('UPDATE `users_conf_'+user_id+'` SET `conf` = %s WHERE `id` = %s LIMIT 1', (conf, id_))
					self.mysql_connections[0].commit()

				except pymysql.Error as err:

					err = str(err.args[1])
					return [None, err]

			return [True, None]

		except Exception:

			err = traceback.format_exc().strip()
			return [None, err]

	def _save_remind(self, data : dict) -> list:

		try:

			message = self.message_filtering(data['message'])

			if data['type'] == 'each hour':
				conf = '{"type":"'+data['type']+'", "minute":'+str(data['minute'])+', "message":"'+message+'"}'

			if data['type'] == 'every few hours':
				conf = '{"type":"'+data['type']+'", "minute":'+str(data['minute'])+', "interval":'+str(data['interval'])+', "message":"'+message+'"}'
				
			if data['type'] == 'at a certain hour':
				conf = '{"type":"'+data['type']+'", "minute":'+str(data['minute'])+', "hour":'+str(data['hour'])+', "message":"'+message+'"}'
				
			if data['type'] == 'every few days':
				conf = '{"type":"'+data['type']+'", "minute":'+str(data['minute'])+', "hour":'+str(data['hour'])+', "interval":'+str(data['interval'])+', "message":"'+message+'"}'
				
			if data['type'] == 'at a certain day':
				conf = '{"type":"'+data['type']+'", "minute":'+str(data['minute'])+', "hour":'+str(data['hour'])+', "day":"'+str(data['day'])+'", "message":"'+message+'"}'
				
			if data['type'] == 'on a certain date':
				conf = '{"type":"'+data['type']+'", "minute":'+str(data['minute'])+', "hour":'+str(data['hour'])+', "number":'+str(data['number'])+', "message":"'+message+'"}'
				
			if data['type'] == 'in a certain month':
				conf = '{"type":"'+data['type']+'", "minute":'+str(data['minute'])+', "hour":'+str(data['hour'])+', "month":"'+str(data['month'])+'", "number":'+str(data['number'])+', "message":"'+message+'"}'
				
			if data['type'] == 'every few months':
				conf = '{"type":"'+data['type']+'", "minute":'+str(data['minute'])+', "hour":'+str(data['hour'])+', "interval":'+str(data['interval'])+', "number":'+str(data['number'])+', "message":"'+message+'"}'

			if data['type'] == 'specific date (once)':
				conf = '{"type":"'+data['type']+'", "minute":'+str(data['minute'])+', "hour":'+str(data['hour'])+', "month":"'+str(data['month'])+'", "number":'+str(data['number'])+', "message":"'+message+'"}'

			user_id = str(data['user_id'])
			id_ = int(data['id'])
			act = data['act']

			with self.mysql_connections[0].cursor() as cursor:

				cursor.execute('SHOW TABLES LIKE \'users_conf_'+user_id+'\'')
				rows = cursor.fetchall()

				if len(rows) == 0:
					cursor.execute(f'''
					CREATE TABLE `users_conf_{user_id}` (
						`id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, 
						`conf` text COLLATE utf8mb4_general_ci NOT NULL DEFAULT ''
					) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
					''')

				if act == 'new':
					cursor.execute('INSERT INTO `users_conf_'+user_id+'` (`conf`) VALUES (%s)', (conf))

				if act == 'edit':
					cursor.execute('UPDATE `users_conf_'+user_id+'` SET `conf` = %s WHERE `id` = %s LIMIT 1', (conf, id_))

			self.mysql_connections[0].commit()

			return [True, None]

		except Exception:

			err = traceback.format_exc().strip()
			return [None, err]

	def _get_last_remind(self, data : dict) -> list:

		try:

			user_id = str(data['user_id'])
			conf = ''

			with self.mysql_connections[0].cursor() as cursor:
				cursor.execute('SELECT * FROM `users_conf_'+user_id+'` ORDER BY id DESC LIMIT 1')
				rows = cursor.fetchall()
				for row in rows:
					conf = '[{"id":'+str(row['id'])+', "conf":'+row['conf']+'}]'

			return [conf, None]

		except Exception:

			err = traceback.format_exc().strip()
			return [None, err]

	def _delete_remind(self, data : dict) -> list:

		try:
			
			user_id = str(data['user_id'])
			id_ = int(data['id'])

			with self.mysql_connections[0].cursor() as cursor:

				try:

					cursor.execute('DELETE FROM `users_conf_'+user_id+'` WHERE `id` = %s LIMIT 1', (id_))
					self.mysql_connections[0].commit()

				except pymysql.Error as err:

					err = str(err.args[1])
					return [None, err]

			return [True, None]

		except Exception:

			err = traceback.format_exc().strip()
			return [None, err]

	def _get_last_edit_remind(self, data : dict) -> list:

		try:

			user_id = str(data['user_id'])
			id_ = int(data['id'])
			conf = ''

			with self.mysql_connections[0].cursor() as cursor:
				cursor.execute('SELECT * FROM `users_conf_'+user_id+'` WHERE `id` = %s LIMIT 1', (id_))
				rows = cursor.fetchall()
				for row in rows:
					conf = '[{"id":'+str(row['id'])+', "conf":'+row['conf']+'}]'

			return [conf, None]

		except Exception:

			err = traceback.format_exc().strip()
			return [None, err]

	def _get_reminds(self, data : dict) -> list:

		try:

			user_id = str(data['user_id'])
			confs = ''

			with self.mysql_connections[0].cursor() as cursor:
				
				try:
					cursor.execute('SELECT * FROM `users_conf_'+user_id+'` ORDER BY id DESC')
				except pymysql.Error as err:

					err = str(err.args[1])
					if 'doesn\'t exist' in err:
						return ['[]', None]

					return [None, err]

				rows = cursor.fetchall()
				for row in rows:
					confs += '{"id":'+str(row['id'])+', "conf":'+row['conf']+'}, '
				confs = '['+re.sub(', $', '', confs)+']'

			return [confs, None]

		except Exception:

			err = traceback.format_exc().strip()
			return [None, err]

	def _check_remind(self, data : dict) -> list:

		try:

			user_id = str(data['user_id'])
			id_ = int(data['id'])

			with self.mysql_connections[0].cursor() as cursor:
				
				try:

					cursor.execute('SELECT `id` FROM `users_conf_'+user_id+'` WHERE `id` = %s LIMIT 1', (id_))
					if len(cursor.fetchall()) > 0:
						return [True, None]
					else:
						return [False, None]

				except pymysql.Error as err:

					err = str(err.args[1])
					if 'doesn\'t exist' in err:
						return [False, None]

					return [None, err]

		except Exception:

			err = traceback.format_exc().strip()
			return [None, err]

	async def query_db(self, act : str, data : dict) -> list:
		
		try:

			if act == 'add_user':
				return await asyncio.to_thread(self._add_user, data)

			if act == 'delete_user':
				return await asyncio.to_thread(self._delete_user, data)

			if act == 'save_timezone':
				return await asyncio.to_thread(self._save_timezone, data)

			if act == 'update_timestamp_and_count':
				return await asyncio.to_thread(self._update_timestamp_and_count, data)

			if act == 'update_current_date_and_count':
				return await asyncio.to_thread(self._update_current_date_and_count, data)

			if act == 'save_remind':
				return await asyncio.to_thread(self._save_remind, data)

			if act == 'get_last_remind':
				return await asyncio.to_thread(self._get_last_remind, data)

			if act == 'delete_remind':
				return await asyncio.to_thread(self._delete_remind, data)

			if act == 'get_last_edit_remind':
				return await asyncio.to_thread(self._get_last_edit_remind, data)

			if act == 'get_reminds':
				return await asyncio.to_thread(self._get_reminds, data)

			if act == 'check_remind':
				return await asyncio.to_thread(self._check_remind, data)

		except Exception:
			return [None, traceback.format_exc().strip()]

	async def report_error_to_admin(self, err : str) -> list:
		
		try:

			if self.config_app['admin_id']:
				err = self.remove_bad_symbol(err)[:255]
				try:
					await self.tg_bot.send_message(self.config_app['admin_id'], '⚠️ An error occurred while running the application:\n\n' + err, parse_mode = 'HTML')
				except exceptions.BotBlocked:
					pass
				except exceptions.ChatNotFound:
					pass
				except exceptions.NetworkError:
					pass

		except Exception:
			await self.log_other_error(traceback.format_exc().strip())

	def read_users_data(self) -> None:
		
		try:

			with self.mysql_connections[0].cursor() as cursor:

				cursor.execute('SELECT * FROM `'+self.config_app['users_table_name']+'`')
				rows = cursor.fetchall()

				for row in rows:
					
					self.users[row['user_id']] = {'timezone':row['timezone'], 'conf':{}}

					try:
						cursor.execute('SELECT * FROM `users_conf_'+row['user_id']+'`')
					except pymysql.Error as err:

						err = str(err.args[1])
						if 'doesn\'t exist' in err:
							continue

						print(f'[Error] {err}')
						sys.exit(1)

					rows2 = cursor.fetchall()

					conf = {}
					for row2 in rows2:
						conf[row2['id']] = json.loads(row2['conf'])

					self.users[row['user_id']]['conf'] = conf
			
		except Exception:

			err = traceback.format_exc().strip()
			print(f'[Error] {err}')
			sys.exit(1)

	def convert_weekday_number_month_hour(self, weekday_ : int, number_ : int, month_ : int, hour_ : int, year_ : int) -> list:
	
		if hour_ < 0:
			hour_ = 24 - (hour_ * -1)
			weekday_ -= 1
			if weekday_ == -1:
				weekday_ = 6
			number_ -= 1
			if number_ == 0:
				month_ -= 1
				if month_ == 0:
					month_ = 12
				number_ = self.months2[month_]
				if year_ in self.leap_years and month_ == 2:
					number_ = 29

		if hour_ > 23:
			hour_ = 24 - hour_
			weekday_ += 1
			if weekday_ == 7:
				weekday_ = 0
			number_ += 1
			if number_ == 29 and month_ == 2 and not year_ in self.leap_years:
				number_ = 1
				month_ += 1
			if number_ == 31 and month_ != 1 and month_ != 3 and month_ != 5 and month_ != 7 and month_ != 8 and month_ != 10 and month_ != 12:
				number_ = 1
				month_ += 1
				if month_ == 13:
					month_ = 1

		return [weekday_, number_, month_, hour_]

	async def check_time_reminders(self) -> None:
		
		try:
			
			while True:
				
				async with lock_2:
					users_ = copy.deepcopy(self.users)
				
				for item in users_:

					user_id = item

					date = datetime.datetime.now().strftime('%d:%m:%Y:%H:%M')
					ex = re.split(':', date)
					
					weekday_ = datetime.datetime.today().weekday()
					number_ = int(ex[0])
					month_ = int(ex[1])
					year_ = int(ex[2])
					hour_ = int(ex[3])
					minute_ = int(ex[4])
					
					if self.server_timezone < 0:
						hour_ += self.server_timezone * -1
						weekday_, number_, month_, hour_ = self.convert_weekday_number_month_hour(weekday_, number_, month_, hour_, year_)
					elif self.server_timezone > 0:
						hour_ -= self.server_timezone
						weekday_, number_, month_, hour_ = self.convert_weekday_number_month_hour(weekday_, number_, month_, hour_, year_)
					
					for i in users_[item]:
						
						if i == 'timezone':
							
							ex = re.split(r'(\+|\-)([0-9]+)', users_[item]['timezone'])
							if len(ex) < 3:
								break

							symbol = ex[1]
							offset = int(ex[2])

							if symbol == '+':
								hour_ += offset
							else:
								hour_ -= offset

							weekday_, number_, month_, hour_ = self.convert_weekday_number_month_hour(weekday_, number_, month_, hour_, year_)

						if i == 'conf':
							
							for y in users_[item]['conf']:

								if users_[item]['conf'][y]['type'] == 'each hour':
									
									if users_[item]['conf'][y]['minute'] == minute_:
									
										is_skip = False
										if 'timestamp2' in users_[item]['conf'][y] and int(time.time()) - users_[item]['conf'][y]['timestamp2'] < 60:
											is_skip = True

										if not is_skip:
											
											async with lock_2:
												for u in self.users[item]:
													if u == 'conf':
														if y in self.users[item][u]:
															self.users[item][u][y]['timestamp2'] = int(time.time())
															break
											
											try:
												await self.tg_bot.send_message(int(user_id), users_[item]['conf'][y]['message'], parse_mode = 'HTML')
											except exceptions.BotBlocked:
												await self.delete_user(user_id)
											except exceptions.ChatNotFound:
												await self.delete_user(user_id)
											except exceptions.NetworkError:
												pass

								if users_[item]['conf'][y]['type'] == 'every few hours':
									
									is_found = False

									if not 'timestamp' in users_[item]['conf'][y]:

										timestamp = int(time.time())
										count = 0
									
										async with lock_2:
											for u in self.users[item]:
												if u == 'conf':
													if y in self.users[item][u]:
														self.users[item][u][y]['timestamp'] = timestamp
														self.users[item][u][y]['count'] = count
														is_found = True
														break
										
										users_[item]['conf'][y]['timestamp'] = timestamp
										users_[item]['conf'][y]['count'] = count
										
									if int(time.time()) - users_[item]['conf'][y]['timestamp'] >= 3600:

										timestamp = int(time.time())
										count = 0

										async with lock_2:
											for u in self.users[item]:
												if u == 'conf':
													if y in self.users[item][u]:
														self.users[item][u][y]['timestamp'] = timestamp
														self.users[item][u][y]['count'] += 1
														count = self.users[item][u][y]['count']
														is_found = True
														break

										if is_found:
											users_[item]['conf'][y]['timestamp'] = timestamp
											users_[item]['conf'][y]['count'] = count

									if users_[item]['conf'][y]['count'] >= users_[item]['conf'][y]['interval'] and users_[item]['conf'][y]['minute'] == minute_:
										
										is_skip = False
										if 'timestamp2' in users_[item]['conf'][y] and int(time.time()) - users_[item]['conf'][y]['timestamp2'] < 60:
											is_skip = True
										
										if not is_skip:

											timestamp = int(time.time())
											count = 0

											async with lock_2:
												for u in self.users[item]:
													if u == 'conf':
														if y in self.users[item][u]:
															self.users[item][u][y]['timestamp2'] = timestamp
															self.users[item][u][y]['timestamp'] = timestamp
															self.users[item][u][y]['count'] = count
															is_found = True
															break

											if is_found:
												users_[item]['conf'][y]['timestamp'] = timestamp
												users_[item]['conf'][y]['count'] = count
											
											try:
												await self.tg_bot.send_message(int(user_id), users_[item]['conf'][y]['message'], parse_mode = 'HTML')
											except exceptions.BotBlocked:
												await self.delete_user(user_id)
											except exceptions.ChatNotFound:
												await self.delete_user(user_id)
											except exceptions.NetworkError:
												pass

									if is_found:

										result, err = await self.query_db('update_timestamp_and_count', {'user_id':user_id, 'id':y, 'timestamp':timestamp, 'count':count})
										if err:
											await self.log_other_error(err)
											await self.report_error_to_admin(err)
											
								if users_[item]['conf'][y]['type'] == 'at a certain hour':
									
									if users_[item]['conf'][y]['hour'] == hour_ and users_[item]['conf'][y]['minute'] == minute_:
										
										is_skip = False
										if 'timestamp2' in users_[item]['conf'][y] and int(time.time()) - users_[item]['conf'][y]['timestamp2'] < 60:
											is_skip = True
										
										if not is_skip:

											async with lock_2:
												for u in self.users[item]:
													if u == 'conf':
														if y in self.users[item][u]:
															self.users[item][u][y]['timestamp2'] = int(time.time())
															break
											
											try:
												await self.tg_bot.send_message(int(user_id), users_[item]['conf'][y]['message'], parse_mode = 'HTML')
											except exceptions.BotBlocked:
												await self.delete_user(user_id)
											except exceptions.ChatNotFound:
												await self.delete_user(user_id)
											except exceptions.NetworkError:
												pass

								if users_[item]['conf'][y]['type'] == 'every few days':
								
									is_found = False

									if not 'timestamp' in users_[item]['conf'][y]:

										timestamp = int(time.time())
										count = 0

										async with lock_2:
											for u in self.users[item]:
												if u == 'conf':
													if y in self.users[item][u]:
														self.users[item][u][y]['timestamp'] = timestamp
														self.users[item][u][y]['count'] = count
														is_found = True
														break

										users_[item]['conf'][y]['timestamp'] = timestamp
										users_[item]['conf'][y]['count'] = count

									if int(time.time()) - users_[item]['conf'][y]['timestamp'] >= 86400:

										timestamp = int(time.time())
										count = 0

										async with lock_2:
											for u in self.users[item]:
												if u == 'conf':
													if y in self.users[item][u]:
														self.users[item][u][y]['timestamp'] = timestamp
														self.users[item][u][y]['count'] += 1
														count = self.users[item][u][y]['count']
														is_found = True
														break

										if is_found:
											users_[item]['conf'][y]['timestamp'] = timestamp
											users_[item]['conf'][y]['count'] = count

									if users_[item]['conf'][y]['count'] >= users_[item]['conf'][y]['interval'] and users_[item]['conf'][y]['hour'] == hour_ and users_[item]['conf'][y]['minute'] == minute_:
										
										is_skip = False
										if 'timestamp2' in users_[item]['conf'][y] and int(time.time()) - users_[item]['conf'][y]['timestamp2'] < 60:
											is_skip = True

										if not is_skip:

											timestamp = int(time.time())
											count = 0
											
											async with lock_2:
												for u in self.users[item]:
													if u == 'conf':
														if y in self.users[item][u]:
															self.users[item][u][y]['timestamp'] = timestamp
															self.users[item][u][y]['timestamp2'] = timestamp
															self.users[item][u][y]['count'] = count
															is_found = True
															break

											if is_found:
												users_[item]['conf'][y]['timestamp'] = timestamp
												users_[item]['conf'][y]['count'] = count
											
											try:
												await self.tg_bot.send_message(int(user_id), users_[item]['conf'][y]['message'], parse_mode = 'HTML')
											except exceptions.BotBlocked:
												await self.delete_user(user_id)
											except exceptions.ChatNotFound:
												await self.delete_user(user_id)
											except exceptions.NetworkError:
												pass

									if is_found:

										result, err = await self.query_db('update_timestamp_and_count', {'user_id':user_id, 'id':y, 'timestamp':timestamp, 'count':count})
										if err:
											await self.log_other_error(err)
											await self.report_error_to_admin(err)

								if users_[item]['conf'][y]['type'] == 'at a certain day':
									
									if self.weekdays[users_[item]['conf'][y]['day']] == weekday_ and users_[item]['conf'][y]['hour'] == hour_ and users_[item]['conf'][y]['minute'] == minute_:
										
										is_skip = False
										if 'timestamp2' in users_[item]['conf'][y] and int(time.time()) - users_[item]['conf'][y]['timestamp2'] < 60:
											is_skip = True

										if not is_skip:
											
											async with lock_2:
												for u in self.users[item]:
													if u == 'conf':
														if y in self.users[item][u]:
															self.users[item][u][y]['timestamp2'] = int(time.time())
															break

											try:
												await self.tg_bot.send_message(int(user_id), users_[item]['conf'][y]['message'], parse_mode = 'HTML')
											except exceptions.BotBlocked:
												await self.delete_user(user_id)
											except exceptions.ChatNotFound:
												await self.delete_user(user_id)
											except exceptions.NetworkError:
												pass

								if users_[item]['conf'][y]['type'] == 'on a certain date':
									
									if users_[item]['conf'][y]['number'] == number_ and users_[item]['conf'][y]['hour'] == hour_ and users_[item]['conf'][y]['minute'] == minute_:
										
										is_skip = False
										if 'timestamp2' in users_[item]['conf'][y] and int(time.time()) - users_[item]['conf'][y]['timestamp2'] < 60:
											is_skip = True

										if not is_skip:
											
											async with lock_2:
												for u in self.users[item]:
													if u == 'conf':
														if y in self.users[item][u]:
															self.users[item][u][y]['timestamp2'] = int(time.time())
															break

											try:
												await self.tg_bot.send_message(int(user_id), users_[item]['conf'][y]['message'], parse_mode = 'HTML')
											except exceptions.BotBlocked:
												await self.delete_user(user_id)
											except exceptions.ChatNotFound:
												await self.delete_user(user_id)
											except exceptions.NetworkError:
												pass

								if users_[item]['conf'][y]['type'] == 'in a certain month':
									
									if self.months3[users_[item]['conf'][y]['month']] == month_ and users_[item]['conf'][y]['number'] == number_ and users_[item]['conf'][y]['hour'] == hour_ and users_[item]['conf'][y]['minute'] == minute_:
										
										is_skip = False
										if 'timestamp2' in users_[item]['conf'][y] and int(time.time()) - users_[item]['conf'][y]['timestamp2'] < 60:
											is_skip = True
										
										if not is_skip:

											async with lock_2:
												for u in self.users[item]:
													if u == 'conf':
														if y in self.users[item][u]:
															self.users[item][u][y]['timestamp2'] = int(time.time())
															break
											
											try:
												await self.tg_bot.send_message(int(user_id), users_[item]['conf'][y]['message'], parse_mode = 'HTML')
											except exceptions.BotBlocked:
												await self.delete_user(user_id)
											except exceptions.ChatNotFound:
												await self.delete_user(user_id)
											except exceptions.NetworkError:
												pass

								if users_[item]['conf'][y]['type'] == 'every few months':
									
									is_found = False

									if not 'current_date' in users_[item]['conf'][y]:

										current_date = ''
										count = -1

										async with lock_2:
											for u in self.users[item]:
												if u == 'conf':
													if y in self.users[item][u]:
														self.users[item][u][y]['current_date'] = current_date
														self.users[item][u][y]['count'] = count
														is_found = True
														break

										users_[item]['conf'][y]['current_date'] = current_date
										users_[item]['conf'][y]['count'] = count

									if (users_[item]['conf'][y]['current_date'] != str(number_) + ' ' + str(month_) + ' ' + str(year_)) and ((users_[item]['conf'][y]['number'] == number_) or (users_[item]['conf'][y]['number'] > 28 and number_ == 1 and month_ == 3)):

										current_date = str(number_) + ' ' + str(month_) + ' ' + str(year_)
										count = 0

										async with lock_2:
											for u in self.users[item]:
												if u == 'conf':
													if y in self.users[item][u]:
														self.users[item][u][y]['current_date'] = current_date
														self.users[item][u][y]['count'] += 1
														count = self.users[item][u][y]['count']
														is_found = True
														break

										if is_found:
											users_[item]['conf'][y]['current_date'] = current_date
											users_[item]['conf'][y]['count'] = count

									if users_[item]['conf'][y]['count'] >= users_[item]['conf'][y]['interval'] and users_[item]['conf'][y]['hour'] == hour_ and users_[item]['conf'][y]['minute'] == minute_:
										
										is_skip = False
										if 'timestamp2' in users_[item]['conf'][y] and int(time.time()) - users_[item]['conf'][y]['timestamp2'] < 60:
											is_skip = True

										if not is_skip:

											current_date = ''
											count = -1

											async with lock_2:
												for u in self.users[item]:
													if u == 'conf':
														if y in self.users[item][u]:
															self.users[item][u][y]['timestamp2'] = int(time.time())
															self.users[item][u][y]['current_date'] = current_date
															self.users[item][u][y]['count'] = count
															is_found = True
															break
											
											if is_found:
												users_[item]['conf'][y]['current_date'] = current_date
												users_[item]['conf'][y]['count'] = count
											
											try:
												await self.tg_bot.send_message(int(user_id), users_[item]['conf'][y]['message'], parse_mode = 'HTML')
											except exceptions.BotBlocked:
												await self.delete_user(user_id)
											except exceptions.ChatNotFound:
												await self.delete_user(user_id)
											except exceptions.NetworkError:
												pass

									if is_found:

										result, err = await self.query_db('update_current_date_and_count', {'user_id':user_id, 'id':y, 'current_date':current_date, 'count':count})
										if err:
											await self.log_other_error(err)
											await self.report_error_to_admin(err)

								if users_[item]['conf'][y]['type'] == 'specific date (once)':
									
									if self.months3[users_[item]['conf'][y]['month']] == month_ and users_[item]['conf'][y]['number'] == number_ and users_[item]['conf'][y]['hour'] == hour_ and users_[item]['conf'][y]['minute'] == minute_:
										
										try:
											await self.tg_bot.send_message(int(user_id), users_[item]['conf'][y]['message'], parse_mode = 'HTML')
										except exceptions.BotBlocked:
											await self.delete_user(user_id)
										except exceptions.ChatNotFound:
											await self.delete_user(user_id)
										except exceptions.NetworkError:
											pass

										async with lock_2:
											for u in self.users[item]:
												if u == 'conf':
													if y in self.users[item][u]:
														del self.users[item][u][y]
														break

										result, err = await self.query_db('delete_remind', {'user_id':user_id, 'id':y})
										if err:
											await self.log_other_error(err)
											await self.report_error_to_admin(err)

				await asyncio.sleep(30)

		except Exception:
			await self.log_other_error(traceback.format_exc().strip())
	
	async def save_timezone(self, data : dict) -> list:

		try:

			user_id = str(data['user_id'])
			timezone = str(data['timezone'])
			
			if timezone[:1] != '-':
				timezone = '+'+timezone

			if not user_id in self.users:
				return [None, self.default_text_auth_err]

			if self.users[user_id]['timezone'] == '-':

				result, err = await self.query_db('save_timezone', {'user_id':user_id, 'timezone':timezone})
				if err:
					await self.log_other_error(err)
					await self.report_error_to_admin(err)
					return [None, self.default_text_other_err]

				async with lock_2:
					self.users[user_id]['timezone'] = timezone
			
			return [True, None]

		except Exception:

			await self.log_other_error(traceback.format_exc().strip())
			return [None, self.default_text_other_err]

	def is_correct_minute_value(self, minute) -> bool:

		try:
			int(minute)
		except ValueError:
			return False

		if int(minute) < 0 or int(minute) > 59:
			return False

		return True

	def is_correct_hour_value(self, hour) -> bool:

		try:
			int(hour)
		except ValueError:
			return False

		if int(hour) < 0 or int(hour) > 23:
			return False

		return True

	def is_correct_day_value(self, day : str) -> bool:
		return True if day in self.weekdays else False

	def is_correct_month_value(self, month : str) -> bool:
		return True if month in self.months3 else False

	def is_correct_interval_value(self, interval) -> bool:

		try:
			int(interval)
		except ValueError:
			return False

		if int(interval) < 1:
			return False

		return True

	def is_correct_number_value(self, number) -> bool:

		try:
			int(number)
		except ValueError:
			return False

		if int(number) < 1 or int(number) > 31:
			return False

		return True

	async def checking_the_validity_of_the_reminder(self, data : dict) -> list:

		try:

			if not 'user_id' in data:
				return [None, 'missing \\"user_id\\" field']

			if not 'type' in data:
				return [None, 'missing \\"type\\" field']

			if not 'message' in data:
				return [None, 'missing \\"message\\" field']

			if data['message'] == '':
				return [None, '\\"message\\" value is incorrect']
			
			if not 'act' in data:
				return [None, 'missing \\"act\\" field']

			if not data['act'] in ['new', 'edit']:
				return [None, '\\"act\\" value is incorrect']
			
			if not 'id' in data:
				return [None, 'missing \\"id\\" field']
			
			try:
				int(data['id'])
			except ValueError:
				return [None, '\\"id\\" value is not numeric']

			try:
				int(data['user_id'])
			except ValueError:
				return [None, '\\"user_id\\" value is not numeric']

			if not data['type'] in ['each hour', 'every few hours', 'at a certain hour', 'every few days', 'at a certain day', 'on a certain date', 'in a certain month', 'every few months', 'specific date (once)']:
				return [None, '\\"type\\" value is incorrect']

			if data['type'] == 'each hour':

				if not 'minute' in data:
					return [None, 'missing \\"minute\\" field']
				if not self.is_correct_minute_value(data['minute']):
					return [None, '\\"minute\\" value is incorrect']

			if data['type'] == 'every few hours':

				if not 'minute' in data:
					return [None, 'missing \\"minute\\" field']
				if not self.is_correct_minute_value(data['minute']):
					return [None, '\\"minute\\" value is incorrect']

				if not 'interval' in data:
					return [None, 'missing \\"interval\\" field']
				if not self.is_correct_interval_value(data['interval']):
					return [None, '\\"interval\\" value is incorrect']

			if data['type'] == 'at a certain hour':

				if not 'hour' in data:
					return [None, 'missing \\"hour\\" field']
				if not self.is_correct_hour_value(data['hour']):
					return [None, '\\"hour\\" value is incorrect']

				if not 'minute' in data:
					return [None, 'missing \\"minute\\" field']
				if not self.is_correct_minute_value(data['minute']):
					return [None, '\\"minute\\" value is incorrect']

			if data['type'] == 'every few days':

				if not 'hour' in data:
					return [None, 'missing \\"hour\\" field']
				if not self.is_correct_hour_value(data['hour']):
					return [None, '\\"hour\\" value is incorrect']

				if not 'minute' in data:
					return [None, 'missing \\"minute\\" field']
				if not self.is_correct_minute_value(data['minute']):
					return [None, '\\"minute\\" value is incorrect']

				if not 'interval' in data:
					return [None, 'missing \\"interval\\" field']
				if not self.is_correct_interval_value(data['interval']):
					return [None, '\\"interval\\" value is incorrect']

			if data['type'] == 'at a certain day':

				if not 'day' in data:
					return [None, 'missing \\"day\\" field']
				if not self.is_correct_day_value(data['day']):
					return [None, '\\"day\\" value is incorrect']

				if not 'hour' in data:
					return [None, 'missing \\"hour\\" field']
				if not self.is_correct_hour_value(data['hour']):
					return [None, '\\"hour\\" value is incorrect']

				if not 'minute' in data:
					return [None, 'missing \\"minute\\" field']
				if not self.is_correct_minute_value(data['minute']):
					return [None, '\\"minute\\" value is incorrect']

			if data['type'] == 'on a certain date':

				if not 'number' in data:
					return [None, 'missing \\"number\\" field']
				if not self.is_correct_number_value(data['number']):
					return [None, '\\"number\\" value is incorrect']

				if not 'hour' in data:
					return [None, 'missing \\"hour\\" field']
				if not self.is_correct_hour_value(data['hour']):
					return [None, '\\"hour\\" value is incorrect']

				if not 'minute' in data:
					return [None, 'missing \\"minute\\" field']
				if not self.is_correct_minute_value(data['minute']):
					return [None, '\\"minute\\" value is incorrect']

			if data['type'] == 'in a certain month':

				if not 'month' in data:
					return [None, 'missing \\"month\\" field']
				if not self.is_correct_month_value(data['month']):
					return [None, '\\"month\\" value is incorrect']

				if not 'number' in data:
					return [None, 'missing \\"number\\" field']
				if not self.is_correct_number_value(data['number']):
					return [None, '\\"number\\" value is incorrect']

				if not 'hour' in data:
					return [None, 'missing \\"hour\\" field']
				if not self.is_correct_hour_value(data['hour']):
					return [None, '\\"hour\\" value is incorrect']

				if not 'minute' in data:
					return [None, 'missing \\"minute\\" field']
				if not self.is_correct_minute_value(data['minute']):
					return [None, '\\"minute\\" value is incorrect']
			
			if data['type'] == 'every few months':

				if not 'number' in data:
					return [None, 'missing \\"number\\" field']
				if not self.is_correct_number_value(data['number']):
					return [None, '\\"number\\" value is incorrect']

				if not 'hour' in data:
					return [None, 'missing \\"hour\\" field']
				if not self.is_correct_hour_value(data['hour']):
					return [None, '\\"hour\\" value is incorrect']

				if not 'minute' in data:
					return [None, 'missing \\"minute\\" field']
				if not self.is_correct_minute_value(data['minute']):
					return [None, '\\"minute\\" value is incorrect']

				if not 'interval' in data:
					return [None, 'missing \\"interval\\" field']
				if not self.is_correct_interval_value(data['interval']):
					return [None, '\\"interval\\" value is incorrect']

			if data['type'] == 'specific date (once)':

				if not 'month' in data:
					return [None, 'missing \\"month\\" field']
				if not self.is_correct_month_value(data['month']):
					return [None, '\\"month\\" value is incorrect']

				if not 'number' in data:
					return [None, 'missing \\"number\\" field']
				if not self.is_correct_number_value(data['number']):
					return [None, '\\"number\\" value is incorrect']

				if not 'hour' in data:
					return [None, 'missing \\"hour\\" field']
				if not self.is_correct_hour_value(data['hour']):
					return [None, '\\"hour\\" value is incorrect']

				if not 'minute' in data:
					return [None, 'missing \\"minute\\" field']
				if not self.is_correct_minute_value(data['minute']):
					return [None, '\\"minute\\" value is incorrect']

			return [True, None]

		except Exception:

			await self.log_other_error(traceback.format_exc().strip())
			return [None, self.default_text_other_err]

	async def save_remind(self, data : dict) -> list:

		try:

			user_id = str(data['user_id'])

			if not user_id in self.users:
				return [None, self.default_text_auth_err]

			if data['act'] == 'edit':

				result, err = await self.query_db('check_remind', data)
				if err:
					await self.log_other_error(err)
					await self.report_error_to_admin(err)
					return [None, self.default_text_other_err]
				
				if not result:
					return [None, 'this reminder was not found']
			
			result, err = await self.query_db('save_remind', data)
			if err:
				await self.log_other_error(err)
				await self.report_error_to_admin(err)
				return [None, self.default_text_other_err]

			if data['act'] == 'new':

				result, err = await self.query_db('get_last_remind', data)
				if err:
					await self.log_other_error(err)
					await self.report_error_to_admin(err)
					return [None, self.default_text_other_err]

				result_ = json.loads(result)

				async with lock_2:
					self.users[user_id]['conf'][result_[0]['id']] = result_[0]['conf']
			
			if data['act'] == 'edit':
				
				result, err = await self.query_db('get_last_edit_remind', data)
				if err:
					await self.log_other_error(err)
					await self.report_error_to_admin(err)
					return [None, self.default_text_other_err]

				result_ = json.loads(result)
				
				async with lock_2:
					if int(data['id']) in self.users[user_id]['conf']:
						self.users[user_id]['conf'][result_[0]['id']] = result_[0]['conf']
			
			return [result, None]

		except Exception:

			await self.log_other_error(traceback.format_exc().strip())
			return [None, self.default_text_other_err]

	async def delete_remind(self, user_id : str, id_ : int) -> list:

		try:
			
			if not user_id in self.users:
				return [None, self.default_text_auth_err]

			result, err = await self.query_db('delete_remind', {'user_id':user_id, 'id':id_})
			if err:
				await self.log_other_error(err)
				await self.report_error_to_admin(err)
				return [None, self.default_text_other_err]
			
			async with lock_2:
				if id_ in self.users[user_id]['conf']:
					del self.users[user_id]['conf'][id_]
			
			return [str(id_), None]

		except Exception:

			await self.log_other_error(traceback.format_exc().strip())
			return [None, self.default_text_other_err]

	async def edit_remind(self, data : dict) -> list:

		try:
			
			user_id = str(data['user_id'])
			id_ = int(data['id'])

			if not user_id in self.users:
				return [None, self.default_text_auth_err]

			result, err = await self.query_db('edit_remind', data)
			if err:
				await self.log_other_error(err)
				await self.report_error_to_admin(err)
				return [None, self.default_text_other_err]

			result, err = await self.query_db('get_last_edit_remind', data)
			if err:
				await self.log_other_error(err)
				await self.report_error_to_admin(err)
				return [None, self.default_text_other_err]

			result_ = json.loads(result)

			async with lock_2:
				if id_ in self.users[user_id]['conf']:
					self.users[user_id]['conf'][id_] = result_[0]['conf']
			
			return [result, None]

		except Exception:

			await self.log_other_error(traceback.format_exc().strip())
			return [None, self.default_text_other_err]

	async def get_reminds(self, user_id : str) -> list:

		try:
			
			if not user_id in self.users:
				return [None, self.default_text_auth_err]

			result, err = await self.query_db('get_reminds', {'user_id':user_id})
			if err:
				await self.log_other_error(err)
				await self.report_error_to_admin(err)
				return [None, self.default_text_other_err]

			return [result, None]

		except Exception:

			await self.log_other_error(traceback.format_exc().strip())
			return [None, self.default_text_other_err]

	async def delete_user(self, user_id : str) -> None:
		
		try:

			result, err = await self.query_db('delete_user', {"user_id":user_id})
			if err:
				await self.log_other_error(err)
				await self.report_error_to_admin(err)

			async with lock_2:
				if user_id in self.users:
					del self.users[user_id]

		except Exception:
			await self.log_other_error(traceback.format_exc().strip())

	async def get_lang_json(self, accept_language_header : Union[str, None]) -> list:

		try:

			lang = 'us'
			
			if not accept_language_header is None:
				lang = accept_language_header[:2]

			lang = lang.replace('en', 'us')
			file_path = self.install_dir+'/public/lang/'+lang+'.json'

			if not os.path.isfile(file_path):
				file_path = self.install_dir+'/public/lang/us.json'

			with open(file_path, 'r', encoding = 'utf-8') as f:
				text = f.read()
			if text == '':
				text = '{}'
			return [text, None]
		
		except Exception:
			return [None, traceback.format_exc().strip()]


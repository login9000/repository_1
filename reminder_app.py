# -*- coding: utf-8 -*-

import os
import re
import sys
import traceback
from aiogram import Bot, Dispatcher, types # pip3 install aiogram
from dotenv import load_dotenv # pip3 install python-dotenv
from business_logic import Business_logic
import asyncio
import tornado.ioloop # pip3 install tornado
import tornado.web
import tornado.httputil


install_dir = ''
app_version = '2.2'
config_app = {}
tg_bot = None
bl = None
compiled_template_cache = True

def parse_env() -> None:

	global config_app
	
	try:

		load_dotenv()

		config_app['telegram_token'] = os.getenv('TELEGRAM_TOKEN')
		config_app['admin_id'] = os.getenv('ADMIN_ID')
		config_app['http_server_port'] = os.getenv('HTTP_SERVER_PORT')
		config_app['url_webapp'] = os.getenv('URL_WEBAPP')
		config_app['users_table_name'] = os.getenv('USERS_TABLE_NAME')
		config_app['db_host'] = os.getenv('DB_HOST')
		config_app['db_port'] = os.getenv('DB_PORT')
		config_app['db_database'] = os.getenv('DB_DATABASE')
		config_app['db_username'] = os.getenv('DB_USERNAME')
		config_app['db_password'] = os.getenv('DB_PASSWORD')
		
		if not config_app['http_server_port']:
			print(f'[Error] http_server_port is enpty or not set. See {install_dir}/.env file')
			sys.exit(1)
		try:
			config_app['http_server_port'] = int(config_app['http_server_port'])
		except ValueError:
			print(f'[Error] http_server_port is incorrect, a number between 80 and 65535 is required. See {install_dir}/.env file')
			sys.exit(1)
		if config_app['http_server_port'] < 80 or config_app['http_server_port'] > 65535:
			print(f'[Error] http_server_port is incorrect, a number between 80 and 65535 is required. See {install_dir}/.env file')
			sys.exit(1)

		if not config_app['admin_id']:
			print(f'[Warning] admin_id is enpty or not set. See {install_dir}/.env file')

		if not config_app['url_webapp']:
			print(f'[Error] url_webapp is enpty or not set. See {install_dir}/.env file')
			sys.exit(1)
		ex = re.split('https://.*?\.(.*?)$', config_app['url_webapp'])
		if len(ex) < 2:
			print(f'[Error] url_webapp is incorrect. See {install_dir}/.env file')
			sys.exit(1)
		if not '/' in ex[1]:
			config_app['url_webapp'] += '/'

		if not config_app['users_table_name']:
			print(f'[Error] users_table_name is enpty or not set. See {install_dir}/.env file')
			sys.exit(1)

		if not config_app['telegram_token']:
			print(f'[Error] telegram_token is enpty or not set. See {install_dir}/.env file')
			sys.exit(1)

		if not config_app['db_host']:
			print(f'[Error] db_host is enpty or not set. See {install_dir}/.env file')
			sys.exit(1)

		if not config_app['db_port']:
			print(f'[Error] db_port is enpty or not set. See {install_dir}/.env file')
			sys.exit(1)
		try:
			config_app['db_port'] = int(config_app['db_port'])
		except ValueError:
			print(f'[Error] db_port is incorrect, a number between 1025 and 65535 is required. See {install_dir}/.env file')
			sys.exit(1)
		if config_app['db_port'] < 1025 or config_app['db_port'] > 65535:
			print(f'[Error] db_port is incorrect, a number between 1025 and 65535 is required. See {install_dir}/.env file')
			sys.exit(1)

		if not config_app['db_database']:
			print(f'[Error] db_database is enpty or not set. See {install_dir}/.env file')
			sys.exit(1)

		if not config_app['db_username']:
			print(f'[Error] db_username is enpty or not set. See {install_dir}/.env file')
			sys.exit(1)

		if not config_app['db_password']:
			print(f'[Error] db_password is enpty or not set. See {install_dir}/.env file')
			sys.exit(1)

	except Exception:

		err = traceback.format_exc().strip()
		print(f'[Error] {err}')
		sys.exit(1)

class handler_index(tornado.web.RequestHandler):
	
	install_dir = ''

	def __init__(self, application : "Application", request : tornado.httputil.HTTPServerRequest, **kwargs : any) -> None:
		super().__init__(application, request, **kwargs)
		self.install_dir = re.sub(r'/[^/]+$', '', os.path.abspath(__file__).replace(u'\\', u'/'))
	
	async def get(self) -> None:
		
		try:
		
			path = self.install_dir+'/public'
			index_file = ''

			if os.path.isfile(path + '/index.html'):
				index_file = path + '/index.html'
			elif os.path.isfile(path + '/index.htm'):
				index_file = path + '/index.htm'

			if index_file == '':
				self.set_status(404)
				self.write('<html><title>404: Not Found</title><body>404: Not Found</body></html>')
				return

			self.render(index_file)

		except Exception as err:
			self.write(traceback.format_exc().strip())

class handler_static_file(tornado.web.RequestHandler):

	install_dir = ''
	binary_extensions = {'jpg':'image/jpeg', 'jpeg':'image/jpeg', 'png':'image/png', 'gif':'image/gif', 'ico':'image/x-icon', 'ttf':'application/octet-stream', 'otf':'application/octet-stream', 'eot':'application/octet-stream', 'woff':'application/octet-stream', 'woff2':'application/octet-stream'}
	text_extensions = {'css':'text/css', 'js':'text/javascript', 'txt':'text/plain', 'html':'text/html', 'htm':'text/html', 'log':'text/plain', 'dat':'text/plain', 'svg':'image/svg+xml'}

	def __init__(self, application : "Application", request : tornado.httputil.HTTPServerRequest, **kwargs : any) -> None:
		super().__init__(application, request, **kwargs)
		self.install_dir = re.sub(r'/[^/]+$', '', os.path.abspath(__file__).replace(u'\\', u'/'))

	async def get(self) -> None:

		try:

			uri = re.sub(r'(\?|\&).+', '', self.request.uri)
			path = self.install_dir+'/public'
			
			if os.path.isfile(path + uri):

				ex = re.split(r'\.([^\.]+)$', uri)
				if len(ex) > 1:
					extension = ex[1]
				else:
					extension = None

				if extension:

					if extension in self.binary_extensions:

						self.set_header('content-type', self.binary_extensions[extension])

						try:
							with open(path + uri, 'rb') as f:
								self.write(f.read())
								self.finish()
						except OSError as err:
							self.write(err)

					elif extension in self.text_extensions:

						self.set_header('content-type', self.text_extensions[extension])

						try:
							with open(path + uri, 'r', encoding = 'utf-8') as f:
								self.write(f.read())
						except OSError as err:
							self.write(err)

					else:

						try:
							with open(path + uri, 'r', encoding = 'utf-8') as f:
								self.write(f.read())
						except OSError as err:
							self.write(err)
				
				else:
					
					try:
						with open(path + uri, 'r', encoding = 'utf-8') as f:
							self.write(f.read())
					except OSError as err:
						self.write(err)

			else:
				
				self.set_status(404)
				self.write('<html><title>404: Not Found</title><body>404: Not Found</body></html>')

		except Exception:
			self.write(traceback.format_exc().strip())

class handler_get_lang_json(tornado.web.RequestHandler):
	
	install_dir = ''

	def __init__(self, application : "Application", request : tornado.httputil.HTTPServerRequest, **kwargs : any) -> None:
		super().__init__(application, request, **kwargs)
		self.install_dir = re.sub(r'/[^/]+$', '', os.path.abspath(__file__).replace(u'\\', u'/'))

	async def get(self) -> None:

		try:
			
			result, err = await bl.get_lang_json(self.request.headers.get('Accept-Language'))
			if err:
				self.write('{"error":"'+err+'"}')
				return

			self.write('{"response":'+result+'}')

		except Exception:
			self.write(traceback.format_exc().strip())

class handler_js_error(tornado.web.RequestHandler):
	
	install_dir = ''

	def __init__(self, application : "Application", request : tornado.httputil.HTTPServerRequest, **kwargs : any) -> None:
		super().__init__(application, request, **kwargs)
		self.install_dir = re.sub(r'/[^/]+$', '', os.path.abspath(__file__).replace(u'\\', u'/'))

	async def get(self) -> None:

		try:
		
			mess = self.get_argument(name = 'mess', default = '')
			path = self.get_argument(name = 'path', default = '')
			file = self.get_argument(name = 'file', default = '')
			lineno = self.get_argument(name = 'lineno', default = '')
			
			result, err = await bl.log_js_error(mess, path, file, lineno)
			if err:
				self.write('{"error":"'+err+'"}')
				return

			self.write('{"response":"ok"}')

		except Exception:
			self.write(traceback.format_exc().strip())

class handler_save_timezone(tornado.web.RequestHandler):
	
	install_dir = ''

	def __init__(self, application : "Application", request : tornado.httputil.HTTPServerRequest, **kwargs : any) -> None:
		super().__init__(application, request, **kwargs)
		self.install_dir = re.sub(r'/[^/]+$', '', os.path.abspath(__file__).replace(u'\\', u'/'))

	async def post(self) -> None:

		try:
			
			data = tornado.escape.json_decode(self.request.body)

			if not 'user_id' in data:
				self.write('{"error":"missing \\"user_id\\" field"}')
				return

			if not 'timezone' in data:
				self.write('{"error":"missing \\"timezone\\" field"}')
				return

			try:
				int(data['user_id'])
			except ValueError:
				self.write('{"error":"\\"user_id\\" value is not numeric"}')
				return

			try:
				int(data['timezone'])
			except ValueError:
				self.write('{"error":"\\"timezone\\" value is not numeric"}')
				return

			result, err = await bl.save_timezone(data)
			if err:
				self.write('{"error":"'+err+'"}')
				return

			self.write('{"response":"ok"}')

		except Exception:
			self.write(traceback.format_exc().strip())

class handler_save_remind(tornado.web.RequestHandler):
	
	install_dir = ''

	def __init__(self, application : "Application", request : tornado.httputil.HTTPServerRequest, **kwargs : any) -> None:
		super().__init__(application, request, **kwargs)
		self.install_dir = re.sub(r'/[^/]+$', '', os.path.abspath(__file__).replace(u'\\', u'/'))

	async def post(self) -> None:

		try:
			
			data = tornado.escape.json_decode(self.request.body)
			
			result, err = await bl.checking_the_validity_of_the_reminder(data) # check the data for correctness
			if err:
				self.write('{"error":"'+err+'"}')
				return

			result, err = await bl.save_remind(data)
			if err:
				self.write('{"error":"'+err+'"}')
				return

			self.write('{"response":'+result+'}')

		except Exception:
			self.write(traceback.format_exc().strip())

class handler_delete_remind(tornado.web.RequestHandler):
	
	install_dir = ''

	def __init__(self, application : "Application", request : tornado.httputil.HTTPServerRequest, **kwargs : any) -> None:
		super().__init__(application, request, **kwargs)
		self.install_dir = re.sub(r'/[^/]+$', '', os.path.abspath(__file__).replace(u'\\', u'/'))

	async def delete(self) -> None:

		try:

			user_id = self.get_argument(name = 'user_id', default = '')
			id_ = self.get_argument(name = 'id', default = '')

			if user_id == '':
				self.write('{"error":"\\"user_id\\" value is incorrect"}')
				return

			if id_ == '':
				self.write('{"error":"\\"id\\" value is incorrect"}')
				return

			result, err = await bl.delete_remind(str(user_id), int(id_))
			if err:
				self.write('{"error":"'+err+'"}')
				return

			self.write('{"response":{"id":'+result+'}}')

		except Exception:
			self.write(traceback.format_exc().strip())

class handler_get_reminds(tornado.web.RequestHandler):
	
	install_dir = ''

	def __init__(self, application : "Application", request : tornado.httputil.HTTPServerRequest, **kwargs : any) -> None:
		super().__init__(application, request, **kwargs)
		self.install_dir = re.sub(r'/[^/]+$', '', os.path.abspath(__file__).replace(u'\\', u'/'))

	async def get(self) -> None:

		try:
			
			user_id = self.get_argument(name = 'user_id', default = '')

			if user_id == '':
				self.write('{"error":"\\"user_id\\" value is incorrect"}')
				return

			result, err = await bl.get_reminds(str(user_id))
			if err:
				self.write('{"error":"'+err+'"}')
				return

			self.write('{"response":'+result+'}')

		except Exception:
			self.write(traceback.format_exc().strip())

async def launch_tornado(routes : list) -> None:

	http_server = tornado.httpserver.HTTPServer(tornado.web.Application(routes, compiled_template_cache = compiled_template_cache))
	http_server.bind(config_app['http_server_port'], '0.0.0.0')
	http_server.start()
	await asyncio.Event().wait()

async def launch_tg_bot(dispatcher : object) -> None:

	@dispatcher.message_handler(commands = ['start'])
	async def get_start_message(message : types.Message):
		await bl.get_start_message(message)

	await dispatcher.skip_updates()
	await dispatcher.start_polling(fast = False)

if __name__ == '__main__':

	print('reminder_app v'+app_version)

	install_dir = re.sub(r'/[^/]+$', '', os.path.abspath(__file__).replace(u'\\', u'/'))
	parse_env()

	tg_bot = Bot(token = config_app['telegram_token'])
	dispatcher = Dispatcher(tg_bot)
	
	bl = Business_logic(tg_bot = tg_bot, config_app = config_app)

	print('[Info] Application launched')

	bl.read_users_data()
	
	# use a more advanced event loop
	if sys.platform != 'win32':
		try:
			import uvloop # pip3 install uvloop
			asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())
		except ModuleNotFoundError:
			pass
	
	url_index = re.sub('https://.*?\..*?(/.*?)$', r'\1', config_app['url_webapp'])
	
	# routing requests from the frontend
	routes = [
	(url_index, handler_index),
	('/.*?\.[a-z0-9_]+', handler_static_file),
	('/get_lang_json', handler_get_lang_json),
	('/js_error', handler_js_error),
	('/save_timezone', handler_save_timezone),
	('/save_remind', handler_save_remind),
	('/delete_remind', handler_delete_remind),
	('/get_reminds', handler_get_reminds),
	]

	loop = None

	try:

		loop = asyncio.new_event_loop()
		tasks = [
			loop.create_task(launch_tornado(routes)), # tornado server will accept requests from the frontend
			loop.create_task(bl.check_time_reminders()), # run the time tracking algorithm to trigger the reminder
			loop.create_task(launch_tg_bot(dispatcher)), # run tg bot
		]
		loop.run_until_complete(asyncio.wait(tasks))

		try:
			loop.stop()
		except Exception:
			pass

	except KeyboardInterrupt:

		print('[Info] Application stopped')

		try:
			if loop:
				loop.stop()
		except Exception:
			pass
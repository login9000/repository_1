# -*- coding: utf-8 -*-

import re
import os
import sys
import asyncio
import traceback
from urllib.parse import quote, unquote
from dotenv import load_dotenv # pip3 install python-dotenv
from log_functions import Log_functions
from sanic.request import Request # pip3 install sanic
from sanic.response import json as json2
from connect_to_service_functions import Connect_to_service_functions
from color_print import Color_print


class Business_logic():
	
	version = '1.0'
	document_root = ''
	config_app = {}
	log_functions = None
	connect_to_service_functions = None
	
	def __init__(self) -> None:

		self.document_root = re.sub(r'/[^/]+$', '', os.path.abspath(__file__).replace(u'\\', u'/'))
		self.log_functions = Log_functions()
		self.aes_key = self.get_aes_key()
	
	def prepare_response(self, result : dict) -> dict:
		
		if result and 'error' in result:

			dictt = {}
			for item in result:
				key = item
				val = result[item]
				if key == 'error':
					if not isinstance(result[item], dict):
						val = re.sub('\r?\n', '', val)
				dictt[key] = val
				
			return json2(dictt, status = 400)
		
		return json2(result)
	
	def init_connect_to_service_functions(self) -> None:
		self.connect_to_service_functions = Connect_to_service_functions(self.config_app)

	def get_aes_key(self) -> str:
		
		try:

			with open(self.document_root+'/aes_key', 'r', encoding = 'utf-8') as f:
				text = f.readline()
			return text

		except Exception:

			err = traceback.format_exc().strip()
			self.log_functions.log_err_http_server(err)
			return ''

	def parse_env(self, act: int) -> None:

		try:

			load_dotenv(override = True)

			self.config_app['db_host'] = os.getenv('DB_HOST')
			self.config_app['db_port'] = os.getenv('DB_PORT')
			self.config_app['db_database'] = os.getenv('DB_DATABASE')
			self.config_app['db_username'] = os.getenv('DB_USERNAME')
			self.config_app['db_password'] = os.getenv('DB_PASSWORD')
			self.config_app['mysql_driver_service_socket'] = os.getenv('MYSQL_DRIVER_SERVICE_SOCKET')
			self.config_app['mysql_driver_service_port'] = os.getenv('MYSQL_DRIVER_SERVICE_PORT')

			if not self.config_app['mysql_driver_service_socket']:
				if act == 1:
					Color_print._fail(f'E: mysql_driver_service_socket is enpty or not set. See {self.document_root}/../.env file')
					sys.exit(1)
				if act == 2:
					return {'error': f'mysql_driver_service_socket is enpty or not set. See {self.document_root}/../.env file'}

			if not self.config_app['mysql_driver_service_port']:
				if act == 1:
					Color_print._fail(f'E: mysql_driver_service_port is enpty or not set. See {self.document_root}/../.env file')
					sys.exit(1)
				if act == 2:
					return {'error': f'mysql_driver_service_port is enpty or not set. See {self.document_root}/../.env file'}
			try:
				self.config_app['mysql_driver_service_port'] = int(self.config_app['mysql_driver_service_port'])
			except ValueError:
				if act == 1:
					Color_print._fail(f'E: mysql_driver_service_port is incorrect, a number between 1025 and 65535 is required. See {self.document_root}/../.env file')
					sys.exit(1)
				if act == 2:
					return {'error': f'mysql_driver_service_port is incorrect, a number between 1025 and 65535 is required. See {self.document_root}/../.env file'}
			if self.config_app['mysql_driver_service_port'] < 1024 or self.config_app['mysql_driver_service_port'] > 65535:
				if act == 1:
					Color_print._fail(f'E: mysql_driver_service_port is incorrect, a number between 1024 and 65535 is required. See {self.document_root}/../.env file')
					sys.exit(1)
				if act == 2:
					return {'error': f'mysql_driver_service_port is incorrect, a number between 1024 and 65535 is required. See {self.document_root}/../.env file'}

			if not self.config_app['db_host']:
				if act == 1:
					Color_print._fail(f'E: db_host is enpty or not set. See {self.document_root}/../.env file')
					sys.exit(1)
				if act == 2:
					return {'error': f'db_host is enpty or not set. See {self.document_root}/../.env file'}
				
			if not self.config_app['db_port']:
				if act == 1:
					Color_print._fail(f'E: db_port is enpty or not set. See {self.document_root}/../.env file')
					sys.exit(1)
				if act == 2:
					return {'error': f'db_port is enpty or not set. See {self.document_root}/../.env file'}
			try:
				self.config_app['db_port'] = int(self.config_app['db_port'])
			except ValueError:
				if act == 1:
					Color_print._fail(f'E: db_port is incorrect, a number between 1025 and 65535 is required. See {self.document_root}/../.env file')
					sys.exit(1)
				if act == 2:
					return {'error': f'db_port is incorrect, a number between 1025 and 65535 is required. See {self.document_root}/../.env file'}
			if self.config_app['db_port'] < 1025 or self.config_app['db_port'] > 65535:
				if act == 1:
					Color_print._fail(f'E: db_port is incorrect, a number between 1025 and 65535 is required. See {self.document_root}/../.env file')
					sys.exit(1)
				if act == 2:
					return {'error': f'db_port is incorrect, a number between 1025 and 65535 is required. See {self.document_root}/../.env file'}

			if not self.config_app['db_database']:
				if act == 1:
					Color_print._fail(f'E: db_database is enpty or not set. See {self.document_root}/../.env file')
					sys.exit(1)
				if act == 2:
					return {'error': f'db_database is enpty or not set. See {self.document_root}/../.env file'}

			if not self.config_app['db_username']:
				if act == 1:
					Color_print._fail(f'E: db_username is enpty or not set. See {self.document_root}/../.env file')
					sys.exit(1)
				if act == 2:
					return {'error': f'db_username is enpty or not set. See {self.document_root}/../.env file'}

			if not self.config_app['db_password']:
				if act == 1:
					Color_print._fail(f'E: db_password is enpty or not set. See {self.document_root}/../.env file')
					sys.exit(1)
				if act == 2:
					return {'error': f'db_password is enpty or not set. See {self.document_root}/../.env file'}
			
			return {'result': 'ok'}

		except Exception:

			err = traceback.format_exc().strip()

			if act == 1:
				Color_print._fail(f'E: '+err)
				sys.exit(1)

			if act == 2:
				return {'error':err}

	async def select(self, request : Request) -> dict:

		try:

			sql = request.args.get('sql')

			if sql is None:
				return {'error': 'INCORECT_SQL_PARAM'}

			sql = unquote(sql)

			result, err = await self.connect_to_service_functions.mysql_query(sql = sql)
			if err: raise Exception(err)

			return {'response': result}

		except Exception:

			err = traceback.format_exc().strip()
			await asyncio.to_thread(lambda: self.log_functions.log_err_http_server(err))
			return {'error': err}



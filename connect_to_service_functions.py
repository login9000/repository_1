# -*- coding: utf-8 -*-

import re
import sys
import time
import socket
import asyncio
import traceback
import json
from urllib.parse import quote, unquote
import random
import hashlib
import threading


class Connect_to_service_functions():

	config_app = {}
	lock_2 = threading.RLock()

	def __init__(self, config_app: dict) -> None:
		self.config_app = config_app
	
	def _mysql_query(self, data : str = None) -> list:

		result = b''
		err = ''
		_id = hashlib.md5(str(random.uniform(1, 20)).encode('utf-8')).hexdigest()[:10]
		data += '(id:'+_id+')'

		for i in range(3):

			try:
				
				if sys.platform != 'win32':
					sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
				else:
					sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
				sock.settimeout(60)
				
				if sys.platform != 'win32':
					sock.connect(self.config_app['mysql_driver_service_socket'])
				else:
					sock.connect(('127.0.0.1', self.config_app['mysql_driver_service_port']))
				sock.sendall((data+'\n').encode('utf-8'))
				
				while True:
					_data = sock.recv(1024)
					if len(_data) == 0:
						break
					result += _data
					try:
						if re.search(b'(\r|\n|\r\n)$', _data):
							break
					except Exception:
						pass
				result = result.decode('utf-8')
				
				break

			except socket.error as _err:
				
				err = str(_err)
				
				if 'Connection refused' in err:
					if i < 2:
						time.sleep(3)
				else:
					break

			except Exception:

				return [None, re.sub('\r?\n', '', traceback.format_exc().strip())]

			finally:
				
				try:
					sock.close()
				except:
					pass

		if err:
			return [None, err]

		try:
			json_data = json.JSONDecoder().decode(result)
			if 'error' in json_data:
				return [None, json_data['error']]
			return [json_data['result'], None]
		except json.JSONDecodeError:
			return [None, re.sub('\n', '', result)[:512]]

	async def mysql_query(self, sql : str, args : list = None, is_log_error : bool = True, query_id : str = '') -> list:

		if sql == '':
			return []
		
		if args:

			args_ = '['

			for item in args:

				if isinstance(item, str):
					args_ += '"'+quote(item)+'", '
				elif isinstance(item, list):
					args_ += json.dumps(item)+', '
				elif isinstance(item, dict):
					raise Exception('Data type "dict" is not correct')
				else:
					args_ += str(item)+', '

			args_ = re.sub(r', $', '', args_)
			args_ += ']'

			data = '{"sql":"'+sql+'", "args":'+args_+', "is_log_error":'+str(int(is_log_error))+', "query_id":"'+query_id+'"}'
			args_ = None

		else:

			data = '{"sql":"'+sql+'", "is_log_error":'+str(int(is_log_error))+', "query_id":"'+query_id+'"}'
		
		return await asyncio.to_thread(self._mysql_query, data)


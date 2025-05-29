# -*- coding: utf-8 -*-

import os
import re
import sys
import threading
import datetime
import time
import shutil


class Log_functions():

	document_root = ''
	max_size_http_server_errors = 5_000_000
	max_size_http_server_events = 5_000_000
	lock_1 = threading.RLock()
	lock_2 = threading.RLock()

	def __init__(self) -> None:
		self.document_root = re.sub(r'/[^/]+$', '', os.path.abspath(__file__).replace(u'\\', u'/'))

	def log_err_http_server(self, mess) -> None:

		with self.lock_1:

			if mess:

				line = sys._getframe(1).f_lineno

				date = datetime.datetime.now().strftime('%a %b %d %Y %H:%M:%S') + ' '+str(time.time())+' '
				mess = date+' (line:'+str(line)+') '+str(mess) + '\n'+'----------------------------------------------------------------------------------------' + '\n'
				
				file_path = self.document_root+'/errors_http_server.log'

				if os.path.isfile(file_path):
					if os.path.getsize(file_path) > self.max_size_http_server_errors:
						shutil.copyfile(file_path, re.sub('\.log', '_2.log', file_path))
						with open(file_path, 'w+', encoding = 'utf-8') as f:
							pass

				with open(file_path, 'a+', encoding = 'utf-8') as f:
					f.write(mess)

	def log_events(self, mess : str) -> None:

		with self.lock_2:

			if mess:

				date = datetime.datetime.now().strftime('%a %b %d %Y %H:%M:%S') + ' '+str(time.time())+' '
				mess = date+' '+str(mess) + '\n'
				
				file_path = self.document_root+'/events_http_server.log'

				if os.path.isfile(file_path):
					if os.path.getsize(file_path) > self.max_size_http_server_events:
						shutil.copyfile(file_path, re.sub('\.log', '_2.log', file_path))
						with open(file_path, 'w+', encoding = 'utf-8') as f:
							pass

				with open(file_path, 'a+', encoding = 'utf-8') as f:
					f.write(mess)



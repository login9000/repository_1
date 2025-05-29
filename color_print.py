# -*- coding: utf-8 -*-

import sys

class Color_print:
	
	@staticmethod
	def _fail(message):
		sys.stderr.write('\x1b[1;31m'+message.strip()+'\x1b[0m'+'\n')

	@staticmethod
	def _pass(message):
		sys.stdout.write('\x1b[1;32m'+message.strip()+'\x1b[0m'+'\n')

	@staticmethod
	def _warn(message):
		sys.stderr.write('\x1b[1;33m'+message.strip()+'\x1b[0m'+'\n')

	@staticmethod
	def _info(message):
		sys.stdout.write('\x1b[1;34m'+message.strip()+'\x1b[0m'+'\n')

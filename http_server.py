# -*- coding: utf-8 -*-

import re
import os
from sanic import Sanic # pip3 install sanic
from sanic.request import Request
from business_logic import Business_logic
from color_print import Color_print
from sanic.response import HTTPResponse # pip3 install sanic

document_root = re.sub(r'/[^/]+$', '', os.path.abspath(__file__).replace(u'\\', u'/'))
app_version = '1.0'
bl = None
host = '127.0.0.1'
port = 8080

sanic = Sanic(__name__)
bl = Business_logic()

if __name__ == '__main__':
	Color_print._pass('I: http_server v'+app_version)
	Color_print._pass('I: business_logic v'+bl.version)

bl.parse_env(1)
bl.init_connect_to_service_functions()

if __name__ != '__main__':

	sanic.static('/', document_root+'/public')

	@sanic.get('/')
	async def get_home_page(request: Request):
		return HTTPResponse(body = 'Hello world!')

	@sanic.get('/api/v1/select')
	async def select(request: Request):
		result = await bl.select(request)
		return bl.prepare_response(result)
	
if __name__ == '__main__':

	Color_print._pass('I: Listening '+host+':'+str(port)+' ...')

	try:
		sanic.run(host = host, port = port, debug = False, access_log = False, auto_reload = True)
	except KeyboardInterrupt:
		pass



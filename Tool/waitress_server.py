import main
from waitress import serve
from paste.translogger import TransLogger
import argparse


parser = argparse.ArgumentParser()
parser.add_argument('--host', default='', help='server address e.g., xyz.abc.edu')
parser.add_argument('--port', default=8852, help='An accessible port number')
args = parser.parse_args()

serve(TransLogger(main.app, setup_console_handler=False), host=args.host, port=args.port, url_scheme='https')

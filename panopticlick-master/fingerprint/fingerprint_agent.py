import time
class FingerprintAgent(object):

    def __init__(self, request):
        self.request = request

    def detect_server_whorls(self):
        vars_v1 = {}
        f = open('time.txt','w')
        # get cookie enabled
        start = time.time()
        if self.request.cookies:
            vars_v1['cookie_enabled'] = 'Yes'
        else:
            vars_v1['cookie_enabled'] = 'No'
        end = time.time()
        f.write("cookie_enabled : %f ms\n"%(end-start))

        # get user_agent
        start = time.time()
        vars_v1['user_agent'] = self._get_header('User-Agent')
        end = time.time()
        f.write("user agent : %f ms\n"%(end-start))
        
        # get http_accept
        start = time.time()
        vars_v1['http_accept'] = " ".join([
            self._get_header('Accept'),
            self._get_header('Accept-Charset'),
            self._get_header('Accept-Encoding'),
            self._get_header('Accept-Language')
        ])
        end = time.time()
        f.write("http_accept : %f ms\n"%(end-start))

        start = time.time()
        vars_v1['dnt_enabled'] = (self._get_header('DNT') != "")
        end = time.time()
        f.write("dnt_enabled : %f ms\n"%(end-start))

        # these are dummies:
        vars_v1['plugins'] = u"no javascript"
        vars_v1['video'] = u"no javascript"
        vars_v1['timezone'] = u"no javascript"
        vars_v1['language'] = u"no javascript"
        vars_v1['platform'] = u"no javascript"
        vars_v1['touch_support'] = u"no javascript"

        vars_v2 = vars_v1.copy()

        vars_v1['fonts'] = u"no javascript"
        vars_v1['supercookies'] = u"no javascript"
        vars_v1['canvas_hash'] = u"no javascript"
        vars_v1['webgl_hash'] = u"no javascript"

        vars_v2['fonts_v2'] = u"no javascript"
        vars_v2['supercookies_v2'] = u"no javascript"
        vars_v2['canvas_hash_v2'] = u"no javascript"
        vars_v2['webgl_hash_v2'] = u"no javascript"

        vars_v2['timezone_string'] = u"no javascript"
        vars_v2['webgl_vendor_renderer'] = u"no javascript"
        vars_v2['ad_block'] = u"no javascript"
        vars_v2['audio'] = u"no javascript"
        vars_v2['cpu_class'] = u"no javascript"
        vars_v2['hardware_concurrency'] = u"no javascript"
        vars_v2['device_memory'] = u"no javascript"

        return (vars_v1, vars_v2)

    def _get_header(self, header):
        return self.request.headers.get(header) or ""

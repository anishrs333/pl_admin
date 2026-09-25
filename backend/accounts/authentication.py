from rest_framework_simplejwt.authentication import JWTAuthentication

class QueryParamJWTAuthentication(JWTAuthentication):
    """
    Custom authentication class that allows passing the JWT token
    as a query parameter, e.g. /api/payroll/1/slip_pdf/?token=...
    This is useful for mobile PDF downloads where window.open() does not send headers.
    """
    def authenticate(self, request):
        # Check default header authentication first
        header_auth = super().authenticate(request)
        if header_auth is not None:
            return header_auth
        
        # If not present in header, check 'token' in query parameters
        token = request.query_params.get('token')
        if token:
            try:
                validated_token = self.get_validated_token(token)
                return self.get_user(validated_token), validated_token
            except Exception:
                return None
        
        return None

from rest_framework import permissions


class IsHR(permissions.BasePermission):
    """Only HR users can access."""
    def has_permission(self, request, view):
        return request.user and (request.user.role == 'hr' or request.user.is_superuser)


class IsHRorSelfReadOnly(permissions.BasePermission):
    """HR can do anything, others can only read/modify their own."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def _is_owner(self, request, obj):
        user = request.user
        employee = getattr(obj, 'employee', None)
        if employee is not None:
            return employee.user_id == user.id
        intern = getattr(obj, 'intern', None)
        if intern is not None:
            return intern.user_id == user.id
        assigned_to = getattr(obj, 'assigned_to', None)
        if assigned_to is not None:
            return assigned_to.user_id == user.id
        assigned_to_intern = getattr(obj, 'assigned_to_intern', None)
        if assigned_to_intern is not None:
            return assigned_to_intern.user_id == user.id
        if hasattr(obj, 'user') and getattr(obj, 'user', None) is not None:
            return obj.user_id == user.id
        return False

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.role == 'hr' or user.is_superuser:
            return True
        return self._is_owner(request, obj)


class IsOwnerOrReadOnly(permissions.BasePermission):
    """Allow access to own records only."""
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'employee'):
            return obj.employee.user == request.user
        return False

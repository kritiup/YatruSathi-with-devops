"""Chat group and message views."""

from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from ..models import ChatGroup
from ..serializers import ChatGroupSerializer, ChatMessageSerializer
from ..services import ChatService
from ..shared.pagination import LargeResultsSetPagination


class ChatGroupListView(generics.ListAPIView):
    serializer_class = ChatGroupSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            ChatGroup.objects.filter(members=self.request.user)
            .select_related("activity")
            .prefetch_related("members")
        )


class ChatGroupDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ChatGroupSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ChatGroup.objects.filter(members=self.request.user)


class ChatMessageListCreateView(generics.ListCreateAPIView):
    """Messages for either an activity chat or a group chat.

    Which one is decided by whether the URL supplied `group_id` or
    `activity_id`.
    """

    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = LargeResultsSetPagination

    def get_queryset(self):
        group_id = self.kwargs.get("group_id")
        if group_id:
            return ChatService.messages_for_group(group_id, self.request.user)
        return ChatService.messages_for_activity(self.kwargs.get("activity_id"))

    def perform_create(self, serializer):
        group_id = self.kwargs.get("group_id")
        if group_id:
            ChatService.send_group_message(group_id, self.request.user, serializer)
        else:
            serializer.save(
                sender=self.request.user,
                activity_id=self.kwargs.get("activity_id"),
            )


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def mark_group_as_read(request, pk):
    ChatService.mark_group_read(pk, request.user)
    return Response({"status": "success"})


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def add_member(request, pk):
    user = ChatService.add_member(pk, request.user, request.data.get("user_id"))
    return Response({"message": f"User {user.username} added to group"})


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def remove_member(request, pk):
    user = ChatService.remove_member(pk, request.user, request.data.get("user_id"))
    return Response({"message": f"User {user.username} removed from group"})

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { QuickJoinModal } from "./QuickJoinModal";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Users, Eye, Clock, MessageSquare, ChevronDown } from "lucide-react";
import { formatTimeAgo } from "@/utils/formatTime";

interface Room {
  id: string;
  code: string;
  title: string;
  facilitator: string;
  createdAt: string;
  participantCount: number;
}

export function InlineRoomBrowser() {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [joinMode, setJoinMode] = useState<"join" | "watch">("join");
  const [showModal, setShowModal] = useState(false);
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem("rooms_section_open");
    return saved !== "false";
  });

  useEffect(() => {
    localStorage.setItem("rooms_section_open", String(isOpen));
  }, [isOpen]);

  const loadActiveRooms = useCallback(async () => {
    try {
      const { data: meetings, error } = await supabase
        .from("meetings")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;

      if (!meetings || meetings.length === 0) {
        setRooms([]);
        return;
      }

      // Get participant counts
      const roomsWithCounts = await Promise.all(
        meetings.map(async (meeting) => {
          const { count } = await supabase
            .from("participants")
            .select("*", { count: "exact", head: true })
            .eq("meeting_id", meeting.id)
            .eq("is_active", true);

          return {
            id: meeting.id,
            code: meeting.meeting_code,
            title: meeting.title,
            facilitator: meeting.facilitator_name,
            createdAt: meeting.created_at,
            participantCount: count || 0,
          };
        })
      );

      setRooms(roomsWithCounts);
    } catch (error) {
      console.error("Failed to load rooms:", error);
      toast({
        title: "Error",
        description: "Failed to load active rooms",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadActiveRooms();

    // Subscribe to realtime changes
    const meetingsChannel = supabase
      .channel("inline-rooms-meetings")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "meetings" },
        () => loadActiveRooms()
      )
      .subscribe();

    const participantsChannel = supabase
      .channel("inline-rooms-participants")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "participants" },
        () => loadActiveRooms()
      )
      .subscribe();

    return () => {
      meetingsChannel.unsubscribe();
      participantsChannel.unsubscribe();
    };
  }, [loadActiveRooms]);

  const handleQuickJoin = (room: Room, mode: "join" | "watch") => {
    setSelectedRoom(room);
    setJoinMode(mode);
    setShowModal(true);
  };


  const header = (
    <CollapsibleTrigger asChild>
      <button className="flex items-center justify-between w-full group">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Active Rooms
          {!loading && rooms.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({rooms.length} live)
            </span>
          )}
        </h3>
        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
    </CollapsibleTrigger>
  );

  if (loading) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        {header}
        <CollapsibleContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  if (rooms.length === 0) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        {header}
        <CollapsibleContent className="pt-4">
          <EmptyState
            illustration="rooms"
            title="No active rooms"
            description="Be the first to host a meeting!"
            className="py-6"
          />
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      {header}
      <CollapsibleContent className="pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {rooms.map((room) => (
            <Card
              key={room.id}
              className="group hover:border-primary/50 transition-all duration-200 hover:shadow-md"
            >
              <CardContent className="p-3">
                <div className="space-y-2">
                  <div>
                    <h4 className="font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors text-sm">
                      {room.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      by {room.facilitator}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {room.participantCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(room.createdAt)}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleQuickJoin(room, "join")}
                      className="flex-1 h-8 text-xs"
                    >
                      <Users className="h-3 w-3 mr-1" />
                      Join
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickJoin(room, "watch")}
                      className="flex-1 h-8 text-xs"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Watch
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CollapsibleContent>

      {selectedRoom && (
        <QuickJoinModal
          open={showModal}
          onOpenChange={setShowModal}
          roomCode={selectedRoom.code}
          roomTitle={selectedRoom.title}
          mode={joinMode}
        />
      )}
    </Collapsible>
  );
}

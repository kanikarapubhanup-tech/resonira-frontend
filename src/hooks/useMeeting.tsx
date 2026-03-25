import React, { createContext, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "./useAuth";

export interface MeetingRecord {
    id: number;
    time: string;
    title: string;
    attendees: number;
    type: string;
    duration: string | number;
    date: string;
    start_time?: string;
    end_time?: string;
    targetRole?: string;
    meeting_link?: string;
}

interface MeetingContextType {
    meetings: MeetingRecord[];
    addMeeting: (meeting: Omit<MeetingRecord, "id">) => Promise<void>;
    updateMeeting: (id: number, meeting: Partial<MeetingRecord>) => Promise<void>;
    isLoading: boolean;
}

const MeetingContext = createContext<MeetingContextType | undefined>(undefined);

export const MeetingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: meetings = [], isLoading } = useQuery({
        queryKey: ["meetings"],
        enabled: !!user,
        queryFn: async () => {
            const response = await api.get('/meetings');
            const rawData = response.data.data || [];
            return rawData.map((m: any) => ({
                ...m,
                date: m.start_time?.split('T')[0] || "",
                time: new Date(m.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                attendees: m.participants?.length || 0,
                type: m.meeting_type || "team"
            }));
        }
    });

    const addMutation = useMutation({
        mutationFn: async (meeting: Omit<MeetingRecord, "id">) => {
            const response = await api.post('/meetings', meeting);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["meetings"] });
        }
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, meeting }: { id: number, meeting: Partial<MeetingRecord> }) => {
            const response = await api.patch(`/meetings/${id}`, meeting);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["meetings"] });
        }
    });

    const addMeeting = async (m: Omit<MeetingRecord, "id">) => {
        await addMutation.mutateAsync(m);
    };

    const updateMeeting = async (id: number, updates: Partial<MeetingRecord>) => {
        await updateMutation.mutateAsync({ id, meeting: updates });
    };

    return (
        <MeetingContext.Provider value={{ meetings, addMeeting, updateMeeting, isLoading }}>
            {children}
        </MeetingContext.Provider>
    );
};

export const useMeeting = () => {
    const context = useContext(MeetingContext);
    if (context === undefined) {
        throw new Error("useMeeting must be used within a MeetingProvider");
    }
    return context;
};

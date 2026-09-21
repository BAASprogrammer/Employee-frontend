import { useQuery } from "@tanstack/react-query"
import { api } from "../api/axiosInstance"

export const useDevice = () => {
    return useQuery({
        queryKey: ['device'],
        queryFn: ({ signal }) => api.get<string[]>("/api/device", { signal }).then((res) => res.data),
        staleTime: 60_000, // 1 minuto: evita refetch innecesario
    })
}
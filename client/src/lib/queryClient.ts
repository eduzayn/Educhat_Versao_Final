import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorDetails;
    try {
      const text = await res.text();
      errorDetails = text ? JSON.parse(text) : { message: res.statusText };
    } catch {
      errorDetails = { message: res.statusText };
    }

    // Log detalhado para debug
    console.error(`❌ API Error ${res.status}:`, {
      url: res.url,
      status: res.status,
      statusText: res.statusText,
      errorDetails
    });

    // Criar erro com informações detalhadas para mutations
    const error = new Error(`${res.status}: ${errorDetails.message || res.statusText}`);
    (error as any).response = {
      status: res.status,
      statusText: res.statusText,
      data: errorDetails
    };
    
    throw error;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  console.log(`🌐 ApiRequest iniciado:`, { method, url, data });
  
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  console.log(`📡 Resposta recebida:`, { 
    status: res.status, 
    statusText: res.statusText, 
    url: res.url 
  });

  await throwIfResNotOk(res);
  const jsonResponse = await res.json();
  
  console.log(`✅ Resposta JSON:`, jsonResponse);
  return jsonResponse;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutos em vez de infinito
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

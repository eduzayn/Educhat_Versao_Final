import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorDetails;
    try {
      const text = await res.text();
      
      // Verificar se a resposta é HTML (indicando erro de rota)
      if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
        errorDetails = { 
          message: `Endpoint não encontrado (${res.status}): ${res.url}`,
          isHtmlError: true 
        };
      } else {
        errorDetails = text ? JSON.parse(text) : { message: res.statusText };
      }
    } catch (parseError) {
      errorDetails = { 
        message: `Erro de formato na resposta da API (${res.status})`,
        originalError: res.statusText 
      };
    }

    // Log detalhado para debug
    console.error(`❌ API Error ${res.status}:`, {
      url: res.url,
      status: res.status,
      statusText: res.statusText,
      errorDetails
    });

    // Criar erro com informações detalhadas para mutations
    let errorMessage = errorDetails.message || `${res.status}: ${res.statusText}`;
    
    // Mensagens específicas para erros comuns
    if (res.status === 400 && errorDetails.message === 'Invalid conversation data') {
      errorMessage = 'Dados da conversa inválidos. Verifique se o canal foi selecionado corretamente.';
    }
    
    const error = new Error(errorMessage);
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
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  
  // Se o status for 204 (No Content), não há JSON para processar
  if (res.status === 204) {
    return null;
  }
  
  // Verificar se há conteúdo para processar
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return res.json();
  }
  
  // Para outros tipos de conteúdo ou resposta vazia
  return res.text().then(text => text ? text : null);
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

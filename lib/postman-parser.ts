import { 
  PostmanCollection, 
  PostmanEnvironment, 
  PostmanItem, 
  PostmanUrl, 
  TreeNode, 
  HttpMethod 
} from './types';

/**
 * Parses raw URL object or string from Postman collection schema into string
 */
export function formatPostmanUrl(url: PostmanUrl | string): string {
  if (typeof url === 'string') return url;
  if (!url) return '';
  if (url.raw) return url.raw;

  let result = '';
  if (url.protocol) result += `${url.protocol}://`;
  if (url.host) result += Array.isArray(url.host) ? url.host.join('.') : url.host;
  if (url.path) result += '/' + (Array.isArray(url.path) ? url.path.join('/') : url.path);
  if (url.query && url.query.length > 0) {
    const activeQueries = url.query
      .filter((q) => q.enabled !== false)
      .map((q) => `${encodeURIComponent(q.key)}=${encodeURIComponent(q.value)}`)
      .join('&');
    if (activeQueries) result += `?${activeQueries}`;
  }
  return result;
}

/**
 * Converts Postman Collection items recursively into TreeNode hierarchy
 */
export function parsePostmanCollection(json: PostmanCollection): {
  rootNodes: TreeNode[];
  flatEndpointMap: Map<string, TreeNode>;
} {
  const flatEndpointMap = new Map<string, TreeNode>();

  function processItems(
    items: PostmanItem[], 
    parentId: string | null = null, 
    pathPrefix: string = ''
  ): TreeNode[] {
    return items.map((item, index) => {
      const isFolder = Array.isArray(item.item);
      const nodeId = item.id || `${parentId ? parentId + '-' : 'node-'}${index + 1}-${isFolder ? 'folder' : 'endpoint'}`;
      const currentPath = pathPrefix ? `${pathPrefix} / ${item.name}` : item.name;

      if (isFolder) {
        const children = processItems(item.item || [], nodeId, currentPath);
        return {
          id: nodeId,
          name: item.name,
          type: 'folder',
          description: item.description,
          children,
          parentId,
          path: currentPath,
        };
      } else {
        const rawUrl = item.request ? formatPostmanUrl(item.request.url) : '';
        const method = (item.request?.method?.toUpperCase() as HttpMethod) || 'GET';

        const node: TreeNode = {
          id: nodeId,
          name: item.name,
          type: 'endpoint',
          method,
          url: rawUrl,
          description: item.description || item.request?.description,
          request: item.request,
          parentId,
          path: currentPath,
        };

        flatEndpointMap.set(nodeId, node);
        return node;
      }
    });
  }

  const rootNodes = processItems(json.item || []);
  return { rootNodes, flatEndpointMap };
}

/**
 * Parses Postman Environment JSON file into key-value Record
 */
export function parsePostmanEnvironment(json: PostmanEnvironment): Record<string, string> {
  const envMap: Record<string, string> = {};
  if (json && Array.isArray(json.values)) {
    json.values.forEach((varObj) => {
      if (varObj.enabled !== false && varObj.key) {
        envMap[varObj.key] = varObj.value || '';
      }
    });
  }
  return envMap;
}

/**
 * Resolves Postman double curly brace variables like {{baseUrl}}/api/v1/users
 */
export function resolveVariables(text: string, env: Record<string, string>): string {
  if (!text) return text;
  return text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const trimmedKey = key.trim();
    if (env[trimmedKey] !== undefined) {
      return env[trimmedKey];
    }
    return match; // Keep as is if not found
  });
}

/**
 * Returns all endpoint IDs under a given tree node (recursive)
 */
export function getDescendantEndpointIds(node: TreeNode): string[] {
  if (node.type === 'endpoint') return [node.id];
  if (!node.children) return [];

  let ids: string[] = [];
  node.children.forEach((child) => {
    ids = ids.concat(getDescendantEndpointIds(child));
  });
  return ids;
}

/**
 * Pre-packaged Sample Postman Collection for Instant Demo
 */
export const DEMO_COLLECTION_JSON: PostmanCollection = {
  info: {
    _postman_id: "demo-collection-jsonplaceholder",
    name: "JSONPlaceholder & Public APIs Test Suite",
    description: "Sample API collection for testing endpoints, user profiles, posts creation, and public auth endpoints.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  item: [
    {
      name: "Users & Profiles",
      description: "User management API endpoints",
      item: [
        {
          name: "Get All Users",
          request: {
            method: "GET",
            url: "{{baseUrl}}/users",
            description: "Fetches list of 10 users with email, company, and address metadata."
          }
        },
        {
          name: "Get User By ID",
          request: {
            method: "GET",
            url: "{{baseUrl}}/users/1",
            description: "Fetches details for user ID 1."
          }
        },
        {
          name: "Create New User",
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                name: "Antigravity Tester",
                username: "antigravity",
                email: "tester@antigravity.ai",
                company: { name: "Google DeepMind Agentic Suite" }
              }, null, 2)
            },
            url: "{{baseUrl}}/users",
            description: "Creates a new user record."
          }
        }
      ]
    },
    {
      name: "Posts & Content",
      description: "Blog post resources and comments",
      item: [
        {
          name: "Get Posts List",
          request: {
            method: "GET",
            url: "{{baseUrl}}/posts?_limit=5",
            description: "Retrieves top 5 posts."
          }
        },
        {
          name: "Get Single Post",
          request: {
            method: "GET",
            url: "{{baseUrl}}/posts/1",
            description: "Fetch single post details."
          }
        },
        {
          name: "Update Post (PUT)",
          request: {
            method: "PUT",
            header: [
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                id: 1,
                title: "Updated Post Title via AI Runner",
                body: "Automated end-to-end post test content.",
                userId: 1
              }, null, 2)
            },
            url: "{{baseUrl}}/posts/1",
            description: "Full update of post resource."
          }
        },
        {
          name: "Delete Post",
          request: {
            method: "DELETE",
            url: "{{baseUrl}}/posts/1",
            description: "Removes post record."
          }
        }
      ]
    },
    {
      name: "Authentication & Token",
      description: "Auth APIs (ReqRes)",
      item: [
        {
          name: "Login User & Get Token",
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                email: "eve.holt@reqres.in",
                password: "cityslicka"
              }, null, 2)
            },
            url: "https://reqres.in/api/login",
            description: "Logs in user and returns auth token."
          }
        },
        {
          name: "Get Delayed User List",
          request: {
            method: "GET",
            url: "https://reqres.in/api/users?delay=1",
            description: "Simulates SLA latency response."
          }
        }
      ]
    }
  ]
};

export const DEMO_ENVIRONMENT_VARIABLES: Record<string, string> = {
  baseUrl: "https://jsonplaceholder.typicode.com",
  apiKey: "demo_secret_key_12345",
  environment: "staging-sandbox"
};

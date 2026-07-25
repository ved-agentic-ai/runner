import { parsePostmanCollection, formatPostmanUrl } from '@/lib/postman-parser';
import { TreeNode, HttpMethod } from '@/lib/types';

// Helper function to normalize any collection format (Postman v2 JSON or saved Node Tree) into valid TreeNodes
export function parseAndNormalizeServerCollection(parsed: any, fileName: string): {
  collectionName: string;
  rootNodes: TreeNode[];
  flatEndpointMap: Map<string, TreeNode>;
  allNodeIds: string[];
} {
  const flatEndpointMap = new Map<string, TreeNode>();
  const allNodeIds: string[] = [];

  // Case 1: Postman collection schema with .info or .item
  if (parsed.info || parsed.item) {
    const { rootNodes, flatEndpointMap: parsedMap } = parsePostmanCollection(parsed);
    function collectIds(nodes: TreeNode[]) {
      nodes.forEach((n) => {
        allNodeIds.push(n.id);
        if (n.children) collectIds(n.children);
      });
    }
    collectIds(rootNodes);
    return {
      collectionName: parsed.name || parsed.info?.name || fileName,
      rootNodes,
      flatEndpointMap: parsedMap,
      allNodeIds
    };
  }

  // Case 2: Custom node tree array or object with .nodes
  const rawNodes = Array.isArray(parsed) ? parsed : (parsed.nodes || []);

  function normalizeNodes(nodes: any[], parentId: string | null = null, pathPrefix: string = ''): TreeNode[] {
    if (!Array.isArray(nodes)) return [];
    return nodes.map((item, idx) => {
      const isFolder = item.type === 'folder' || Array.isArray(item.children) || Array.isArray(item.item);
      const uniqueSuffix = item.name ? item.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 12) : idx;
      const nodeId = item.id || `${parentId ? parentId + '-' : 'node-'}${idx + 1}-${uniqueSuffix}-${isFolder ? 'folder' : 'endpoint'}`;
      const currentPath = pathPrefix ? `${pathPrefix} / ${item.name}` : (item.name || 'Unnamed');

      allNodeIds.push(nodeId);

      if (isFolder) {
        const rawChildren = item.children || item.item || [];
        const children = normalizeNodes(rawChildren, nodeId, currentPath);
        return {
          id: nodeId,
          name: item.name || 'Folder',
          type: 'folder',
          description: item.description,
          children,
          parentId,
          path: currentPath,
        };
      } else {
        const method = (item.method?.toUpperCase() as HttpMethod) || 'GET';
        const url = item.url || (item.request ? formatPostmanUrl(item.request.url) : '');
        const node: TreeNode = {
          id: nodeId,
          name: item.name || 'Endpoint',
          type: 'endpoint',
          method,
          url,
          description: item.description,
          request: item.request,
          parentId,
          path: currentPath,
        };
        flatEndpointMap.set(nodeId, node);
        return node;
      }
    });
  }

  const rootNodes = normalizeNodes(rawNodes);

  return {
    collectionName: parsed.name || fileName,
    rootNodes,
    flatEndpointMap,
    allNodeIds
  };
}

import request from '@/utils/request'

export function getKnowledgeGraphList() {
  return request({
    url: '/busi-knowledge-graph/list',
    method: 'get'
  })
}

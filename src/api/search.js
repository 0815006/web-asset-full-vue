import request from '@/utils/request'

export function search(params) {
  return request({
    url: '/api/search',
    method: 'get',
    params
  })
}

export function getSearchHealthCheck() {
  return request({
    url: '/api/search/health-check',
    method: 'get'
  })
}

export function reindexAsset(id) {
  return request({
    url: `/api/search/reindex/${id}`,
    method: 'post'
  })
}

export function deleteSearchIndex(solrId) {
  return request({
    url: `/api/search/index/${solrId}`,
    method: 'delete'
  })
}

export function startRebuildAll() {
  return request({
    url: '/api/search/rebuild-all/start',
    method: 'post'
  })
}

export function getRebuildProgress() {
  return request({
    url: '/api/search/rebuild-all/progress',
    method: 'get'
  })
}

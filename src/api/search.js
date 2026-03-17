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

// 新增 API
export function getHotKeywords(params) {
  return request({
    url: '/api/search/hot-keywords',
    method: 'get',
    params
  })
}

export function getGlobalUseTop() {
  return request({
    url: '/api/search/global-use-top',
    method: 'get'
  })
}

export function getGlobalStarTop() {
  return request({
    url: '/api/search/global-star-top',
    method: 'get'
  })
}

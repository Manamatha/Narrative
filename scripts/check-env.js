#!/usr/bin/env node
const required = ['DATABASE_URL','OPENAI_API_KEY']
const missing = required.filter(k => !process.env[k])
if(missing.length>0){
  console.error('Missing required env variables:', missing.join(', '))
  process.exit(1)
}
console.log('All required env variables are set.')

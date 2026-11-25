(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CourseLearning=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function empty(){return {version:1,favorites:[],recent:[],notes:{},attempts:{},wrong:{}};}
  function createStore(courseId,storage,onError){
    if(!/^[a-z][a-z0-9-]{1,80}$/.test(courseId))throw new Error('Invalid course ID');
    const key='wmu-course-study:v1:'+courseId;
    function read(){try{const value=JSON.parse(storage.getItem(key)||'null');if(!value||value.version!==1)return empty();return {version:1,favorites:Array.isArray(value.favorites)?value.favorites.filter(x=>typeof x==='string'):[],recent:Array.isArray(value.recent)?value.recent.filter(x=>x&&typeof x.id==='string'&&Number.isFinite(x.time)).slice(0,20):[],notes:value.notes&&typeof value.notes==='object'&&!Array.isArray(value.notes)?value.notes:{},attempts:value.attempts&&typeof value.attempts==='object'&&!Array.isArray(value.attempts)?value.attempts:{},wrong:value.wrong&&typeof value.wrong==='object'&&!Array.isArray(value.wrong)?value.wrong:{}};}catch{return empty();}}
    function update(fn){const state=read();fn(state);try{storage.setItem(key,JSON.stringify(state));return state;}catch(e){if(onError)onError('当前浏览器无法保存记录，请检查存储设置。');throw e;}}
    function toggleFavorite(id){return update(s=>{s.favorites=s.favorites.includes(id)?s.favorites.filter(x=>x!==id):[...s.favorites,id];});}
    function visit(id){return update(s=>{s.recent=[{id,time:Date.now()},...s.recent.filter(x=>x.id!==id)].slice(0,20);});}
    function saveNote(id,text){return update(s=>{s.notes[id]=String(text).slice(0,12000);});}
    function attempt(id,correct,selection){return update(s=>{s.attempts[id]={correct:!!correct,selection:[...selection],time:Date.now()};if(!correct){const old=s.wrong[id];s.wrong[id]={times:(old?.times||0)+1,lastWrong:Date.now(),resolved:false};}else if(s.wrong[id])s.wrong[id].resolved=true;});}
    function removeWrong(id){return update(s=>{delete s.wrong[id];});}
    return {key,read,toggleFavorite,visit,saveNote,attempt,removeWrong};
  }
  function evaluate(question,selection){
    if(!question||!['single','multiple'].includes(question.type))throw new Error('This question needs self assessment');
    const options=new Set((question.options||[]).map(o=>o.id));
    const chosen=[...new Set(selection)].sort();
    if(!chosen.length||chosen.some(x=>!options.has(x)))throw new Error('请先选择选项。');
    if(question.type==='single'&&chosen.length!==1)throw new Error('单选题请选择一个选项。');
    const answer=[...new Set(question.answer||[])].sort();
    if(!answer.length||answer.some(x=>!options.has(x)))throw new Error('本题答案尚待核对，暂不判分。');
    return {correct:chosen.length===answer.length&&chosen.every((x,i)=>x===answer[i]),selection:chosen,answer};
  }
  return {createStore,evaluate};
});

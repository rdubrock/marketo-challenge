const leadData = require('./leads.json')
const fs = require('fs')

const logMerge = (originalValue, mergeValue, result, mergeReason) => {
  let mergeRecordMessage = `
    ********** Merged record because of ${mergeReason} **************

    Original Value 
    ${JSON.stringify(originalValue)} 
    
    Value To Merge 
    ${JSON.stringify(mergeValue)} 
    
    Result of merge 
    ${JSON.stringify(result)} 

  `

  fs.appendFile('./transactionLog.txt', mergeRecordMessage, (err) => {
    if(err) {
      console.log(err)
    }
  })
}

const isDup = (value, possibleDupes) => {
  let dupIndex = possibleDupes[value]
  if(dupIndex >= 0) {
    return dupIndex
  } else {
    return null
  }
}

const mergeLeads = (unmergedLead, previouslyMergedLead, mergeReason) => {
  let mergeResult
  const unmergedDate = Date.parse(unmergedLead.entryDate)
  const mergedDate = Date.parse(previouslyMergedLead.entryDate)
  if(unmergedDate >= mergedDate) {
    mergeResult = Object.assign({}, previouslyMergedLead, unmergedLead) 
  } else {
    mergeResult = Object.assign({}, unmergedLead, previouslyMergedLead)
  }
  logMerge(previouslyMergedLead, unmergedLead, mergeResult, mergeReason)
  return mergeResult
}

const mergeEmails = (mergedLeads, unmergedLeads) => {
  let emails = {}
  unmergedLeads.forEach((lead) => {
    let dupIndex = isDup(lead.email, emails)
    if(dupIndex != null) {
      let mergedLead = mergeLeads(lead, mergedLeads[dupIndex], 'Duplicate Email')
      mergedLeads[dupIndex] = mergedLead
      emails[lead.email] = dupIndex
    } else {
      mergedLeads.push(lead)
      emails[lead.email] = mergedLeads.length - 1
    }
  }) 
  return mergedLeads
}

const mergeIds = (mergedLeads, unmergedLeads) => {
  let ids = {}
  unmergedLeads.forEach((lead) => {
    let dupIndex = isDup(lead._id, ids)
    if(dupIndex != null) {
      let mergedLead = mergeLeads(lead, mergedLeads[dupIndex], 'Duplicate Id')
      mergedLeads[dupIndex] = mergedLead
      ids[lead._id] = dupIndex
    } else {
      mergedLeads.push(lead)
      ids[lead._id] = mergedLeads.length - 1
    }
  })
  return mergedLeads
}

const mergeData = (data) => {
  if(fs.existsSync('./transactionLog.txt')) {
    fs.unlinkSync('./transactionLog.txt')
  }
  let mergedByEmail = mergeEmails([], data.leads)
  let mergedById = mergeIds([], mergedByEmail)
  let outputData = {
    'leads': mergedById
  }
  fs.writeFileSync('./output.json', JSON.stringify(outputData, null, 4))
}

const handleInput = () => {
  let filepath = process.argv[2]
  if(fs.existsSync(filepath)) {
    let data = fs.readFileSync(filepath)
    mergeData(JSON.parse(data))
    console.log('Merge complete. Merged data is in output.json, and the transaction log is in transactionLog.txt')
  } else {
    console.log('You must specify a filepath argument')
  }
}

handleInput()

import test from 'ava'
import faker from 'faker'

import React from 'react'
import ReactDOM from 'react-dom'
import TestUtils from 'react-addons-test-utils'

import CandidateGoalList from '../CandidateGoalList'
import CandidateGoal from '../CandidateGoal'
import factory from '../../../test/factories'

let baseProps
test.before(async () => {
  baseProps = {
    currentUser: await factory.build('player'),
    chapter: await factory.build('chapter'),
    cycle: await factory.build('cycle'),
    candidateGoals: [],
  }
})

test('renders the cycle number and chapter name', t => {
  t.plan(2)

  const root = TestUtils.renderIntoDocument(
    React.createElement(CandidateGoalList, baseProps)
  )
  const rootNode = ReactDOM.findDOMNode(root)

  t.true(rootNode.textContent.indexOf(baseProps.chapter.name) >= 0)
  t.true(rootNode.textContent.indexOf(baseProps.cycle.cycleNumber) >= 0)
})

test('does not render percentage complete unless it is available', t => {
  t.plan(1)

  const root = TestUtils.renderIntoDocument(
    React.createElement(CandidateGoalList, baseProps)
  )
  const rootNode = ReactDOM.findDOMNode(root)

  t.falsy(rootNode.textContent.match(/\%.*have\svoted/))
})

test('does not renders voting open / closed status unless it is available', t => {
  t.plan(1)

  const root = TestUtils.renderIntoDocument(
    React.createElement(CandidateGoalList, baseProps)
  )
  const rootNode = ReactDOM.findDOMNode(root)

  t.falsy(rootNode.textContent.match(/Voting\sis.*(open|closed)/))
})

test('renders percentage complete (if it is available)', t => {
  t.plan(2)

  const props = Object.assign({}, baseProps, {percentageComplete: 72})
  const root = TestUtils.renderIntoDocument(
    React.createElement(CandidateGoalList, props)
  )
  const rootNode = ReactDOM.findDOMNode(root)

  t.truthy(rootNode.textContent.indexOf(`${props.percentageComplete}`) >= 0)
  t.truthy(rootNode.textContent.match(/\%.*have\svoted/))
})

test('renders voting open / closed status (if it is available)', t => {
  t.plan(1)

  const props = Object.assign({}, baseProps, {isVotingStillOpen: true})
  const root = TestUtils.renderIntoDocument(
    React.createElement(CandidateGoalList, props)
  )
  const rootNode = ReactDOM.findDOMNode(root)

  t.truthy(rootNode.textContent.match(/Voting\sis.*open/))
})

test('renders a link to the goal library', t => {
  t.plan(1)

  const root = TestUtils.renderIntoDocument(
    React.createElement(CandidateGoalList, baseProps)
  )
  const link = TestUtils.findRenderedDOMComponentWithTag(root, 'a')

  t.is(link.href, baseProps.chapter.goalRepositoryURL)
})

test('renders the correct number of candidate goals', t => {
  t.plan(1)

  const candidateGoals = Array.from(Array(3).keys()).map(() => {
    return {
      playerIds: [faker.random.uuid()],
      goal: {
        url: `${baseProps.chapter.goalRepositoryURL}/issues/40`,
        name: 'goal name (#40)',
      }
    }
  })
  const props = Object.assign({}, baseProps, {candidateGoals})
  const root = TestUtils.renderIntoDocument(
    React.createElement(CandidateGoalList, props)
  )
  const cgs = TestUtils.scryRenderedComponentsWithType(root, CandidateGoal)

  t.is(cgs.length, candidateGoals.length)
})

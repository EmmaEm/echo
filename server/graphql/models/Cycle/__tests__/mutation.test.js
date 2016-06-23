/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import fields from '../mutation'
import r from '../../../../../db/connect'
import factory from '../../../../../test/factories'
import {
  CYCLE_STATES,
  GOAL_SELECTION,
  PRACTICE,
  REFLECTION,
} from '../../../../../common/models/cycle'
import {getCycleById} from '../../../../../server/db/cycle'
import {withDBCleanup, runGraphQLMutation} from '../../../../../test/helpers'

describe(testContext(__filename), function () {
  withDBCleanup()

  beforeEach('create moderator', async function () {
    try {
      this.moderatorUser = await factory.build('user', {roles: ['moderator']})
      this.moderator = await factory.create('moderator', {id: this.moderatorUser.id})
    } catch (e) {
      throw (e)
    }
  })

  describe('createCycle', function () {
    before(function () {
      this.createCycle = function () {
        return runGraphQLMutation(
          'mutation { createCycle { id state } }',
          fields,
          {},
          {currentUser: this.moderatorUser},
        )
      }
    })

    it('creates a new cycle in the GOAL_SELECTION sate', function () {
      return this.createCycle()
        .then(result => result.data.createCycle)
        .then(returnedCycle => getCycleById(returnedCycle.id).then(savedCycle => {
          expect(savedCycle).to.have.property('state', GOAL_SELECTION)
        })
      )
    })
  })

  describe('updateCycleState', function () {
    beforeEach(async function () {
      try {
        this.cycle = await factory.create('cycle', {chapterId: this.moderator.chapterId, state: PRACTICE})
        this.updateCycleState = function (state) {
          return runGraphQLMutation(
            'mutation($state: String!) { updateCycleState(state: $state) { id state } }',
            fields,
            {state},
            {currentUser: this.moderatorUser},
          )
        }
      } catch (e) {
        throw (e)
      }
    })

    it('affects the cycle associated with the moderator if no cycle is specified', function () {
      return this.updateCycleState(REFLECTION)
        .then(() => r.table('cycles').get(this.cycle.id).run())
        .then(updatedCycle => expect(updatedCycle).to.have.property('state', REFLECTION))
    })

    CYCLE_STATES.filter(state => state !== REFLECTION).forEach(state => {
      it('returns an error if you try to change into anything but the "next" state', function () {
        return expect(this.updateCycleState(state)).to.be.rejected
      })
    })
  })
})

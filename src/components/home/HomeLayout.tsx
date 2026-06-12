import React, { useEffect, useMemo } from 'react'
import RulesModal from '../RulesModal/RulesModal'
import Header from '../Header/Header'
import LobbySelector from '../LobbySelector/LobbySelector'
import InfoCard from '../InfoCard/InfoCard'
import BettingSection from '../BettingSection/BettingSection'
import TabSection from '../TabSection/TabSection'
import ActionBar from '../ActionBar/ActionBar'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../../store'
import { getQueryParams } from '../../utils/helper'

import { initSocketListeners } from '../../socket/socketListner'
import CommonPopup from '../modal/CommonPopup'
import BetsClosedModal from '../modal/BetsClosedModal'
import LoaderSocket from '../Loader/LoaderSocket'
const mainStyle: React.CSSProperties = {
  marginTop: '80px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  position: "relative"

};
const HomeLayout = () => {
  const dispatch = useDispatch<AppDispatch>();
  const queryParams = useMemo(() => getQueryParams(), []);
  console.log(queryParams)
  const token = queryParams?.id;
  const gameId = queryParams?.game_id;
  const connected = useSelector((state: RootState) => state.socketSlice.connected);
  const info = useSelector((state: RootState) => state.socketSlice.info);
  useEffect(() => {
    if (!token) return;
    initSocketListeners(dispatch, token, gameId);
  }, [token, dispatch, gameId]);
  if (!connected || !info) return <LoaderSocket />;
  return (
    <>

      <RulesModal />
      <BetsClosedModal />
      <Header />

      <main style={mainStyle}>
              <CommonPopup />
        <LobbySelector />
        <InfoCard />
        <BettingSection />
        <TabSection />
      </main>
      <ActionBar />
    </>
  )
}

export default HomeLayout
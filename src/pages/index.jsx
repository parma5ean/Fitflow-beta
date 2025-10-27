import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Workouts from "./Workouts";

import Progress from "./Progress";

import Nutrition from "./Nutrition";

import Profile from "./Profile";

import AITrainer from "./AITrainer";

import WorkoutPlanBuilder from "./WorkoutPlanBuilder";

import WorkoutTemplates from "./WorkoutTemplates";

import WorkoutTemplateBuilder from "./WorkoutTemplateBuilder";

import CalendarPlanBuilder from "./CalendarPlanBuilder";

import WorkoutSession from "./WorkoutSession";

import Programs from "./Programs";

import ProgramBuilder from "./ProgramBuilder";

import ProgramWorkoutBuilder from "./ProgramWorkoutBuilder";

import ProgramPreview from "./ProgramPreview";

import ExerciseLibrary from "./ExerciseLibrary";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Workouts: Workouts,
    
    Progress: Progress,
    
    Nutrition: Nutrition,
    
    Profile: Profile,
    
    AITrainer: AITrainer,
    
    WorkoutPlanBuilder: WorkoutPlanBuilder,
    
    WorkoutTemplates: WorkoutTemplates,
    
    WorkoutTemplateBuilder: WorkoutTemplateBuilder,
    
    CalendarPlanBuilder: CalendarPlanBuilder,
    
    WorkoutSession: WorkoutSession,
    
    Programs: Programs,
    
    ProgramBuilder: ProgramBuilder,
    
    ProgramWorkoutBuilder: ProgramWorkoutBuilder,
    
    ProgramPreview: ProgramPreview,
    
    ExerciseLibrary: ExerciseLibrary,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Workouts" element={<Workouts />} />
                
                <Route path="/Progress" element={<Progress />} />
                
                <Route path="/Nutrition" element={<Nutrition />} />
                
                <Route path="/Profile" element={<Profile />} />
                
                <Route path="/AITrainer" element={<AITrainer />} />
                
                <Route path="/WorkoutPlanBuilder" element={<WorkoutPlanBuilder />} />
                
                <Route path="/WorkoutTemplates" element={<WorkoutTemplates />} />
                
                <Route path="/WorkoutTemplateBuilder" element={<WorkoutTemplateBuilder />} />
                
                <Route path="/CalendarPlanBuilder" element={<CalendarPlanBuilder />} />
                
                <Route path="/WorkoutSession" element={<WorkoutSession />} />
                
                <Route path="/Programs" element={<Programs />} />
                
                <Route path="/ProgramBuilder" element={<ProgramBuilder />} />
                
                <Route path="/ProgramWorkoutBuilder" element={<ProgramWorkoutBuilder />} />
                
                <Route path="/ProgramPreview" element={<ProgramPreview />} />
                
                <Route path="/ExerciseLibrary" element={<ExerciseLibrary />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}
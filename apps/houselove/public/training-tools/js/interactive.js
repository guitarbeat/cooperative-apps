// Cooperative Housing Culture & Conflict Resolution Training
// Interactive Components JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all interactive components
    initConflictFlowchart();
    initCommunicationSimulator();
    initPolicyWizard();
});

// ===== Conflict Resolution Flowchart =====
function initConflictFlowchart() {
    const flowchartContainer = document.querySelector('.flowchart-container');
    const stepDetails = document.getElementById('step-details');
    
    if (!flowchartContainer) return;
    
    // Define the flowchart steps
    const steps = [
        {
            id: 'step1',
            title: 'Acknowledge the Conflict',
            description: 'Recognize that a conflict exists and needs to be addressed.',
            details: 'Acknowledging conflict is the first step toward resolution. Signs of conflict include tension in meetings, avoidance behaviors, or direct complaints. Create a safe space for discussing the issue by approaching it with curiosity rather than judgment. Remember that conflict is a natural part of community living and can lead to positive growth when handled well.',
            x: 100,
            y: 50,
            next: ['step2']
        },
        {
            id: 'step2',
            title: 'Gather Information',
            description: 'Collect facts and perspectives from all involved parties.',
            details: 'Take time to understand the full picture before attempting resolution. Meet with each party separately to hear their perspective. Ask open-ended questions like "What happened?" and "How did you feel about that?" Document key points without assigning blame. Look for objective information that might help clarify the situation.',
            x: 100,
            y: 150,
            next: ['step3']
        },
        {
            id: 'step3',
            title: 'Identify Interests',
            description: 'Look beyond positions to understand underlying needs.',
            details: 'Positions are what people say they want, while interests are why they want it. For example, someone\'s position might be "I want quiet hours extended," but their interest is "I need uninterrupted sleep." Identifying interests often reveals multiple ways to satisfy everyone\'s core needs. Ask "Why is this important to you?" to uncover underlying interests.',
            x: 100,
            y: 250,
            next: ['step4']
        },
        {
            id: 'step4',
            title: 'Generate Solutions',
            description: 'Brainstorm options that address core interests.',
            details: 'Create a collaborative atmosphere where all parties contribute ideas. Separate idea generation from evaluation—first list all possible solutions without criticism. Encourage creative thinking and build on others\' ideas. Consider solutions that have worked in similar situations. Aim for quantity of ideas first, then evaluate quality.',
            x: 300,
            y: 250,
            next: ['step5']
        },
        {
            id: 'step5',
            title: 'Evaluate & Select Solutions',
            description: 'Choose options that best meet shared needs.',
            details: 'Evaluate each potential solution against objective criteria such as fairness, feasibility, and alignment with cooperative values. Consider both short-term and long-term implications. Look for solutions that address the most important interests of all parties. Document the agreed-upon solution with specific details about implementation.',
            x: 300,
            y: 150,
            next: ['step6']
        },
        {
            id: 'step6',
            title: 'Implement & Follow Up',
            description: 'Put solutions into action and monitor progress.',
            details: 'Create a clear implementation plan with specific actions, responsibilities, and timelines. Schedule check-in points to evaluate how the solution is working. Be prepared to make adjustments if needed. Celebrate successful resolution and acknowledge everyone\'s contributions to the process. Document lessons learned for future conflict resolution.',
            x: 300,
            y: 50,
            next: []
        }
    ];
    
    // Clear loading message
    flowchartContainer.innerHTML = '';
    
    // Create SVG element for the flowchart
    const svg = d3.select('.flowchart-container')
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', '0 0 500 300');
    
    // Draw connections between steps
    const connections = [];
    steps.forEach(step => {
        step.next.forEach(nextId => {
            const nextStep = steps.find(s => s.id === nextId);
            connections.push({
                source: step,
                target: nextStep
            });
        });
    });
    
    svg.selectAll('path')
        .data(connections)
        .enter()
        .append('path')
        .attr('d', d => {
            return `M${d.source.x + 75},${d.source.y + 25} L${d.target.x},${d.target.y + 25}`;
        })
        .attr('stroke', '#4299E1')
        .attr('stroke-width', 2)
        .attr('fill', 'none')
        .attr('marker-end', 'url(#arrow)');
    
    // Add arrow marker for the connections
    svg.append('defs').append('marker')
        .attr('id', 'arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 8)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#4299E1');
    
    // Draw step boxes
    const stepGroups = svg.selectAll('g')
        .data(steps)
        .enter()
        .append('g')
        .attr('transform', d => `translate(${d.x}, ${d.y})`)
        .attr('class', 'step')
        .style('cursor', 'pointer')
        .on('click', function(event, d) {
            // Update step details when clicked
            stepDetails.innerHTML = `
                <h4 class="font-semibold text-lg mb-2">${d.title}</h4>
                <p class="mb-3">${d.description}</p>
                <div class="bg-white p-3 rounded border border-blue-200">
                    <p>${d.details}</p>
                </div>
            `;
            
            // Highlight the selected step
            svg.selectAll('rect').attr('fill', '#EBF8FF');
            d3.select(this).select('rect').attr('fill', '#BEE3F8');
        });
    
    // Add rectangles for each step
    stepGroups.append('rect')
        .attr('width', 150)
        .attr('height', 50)
        .attr('rx', 5)
        .attr('ry', 5)
        .attr('fill', '#EBF8FF')
        .attr('stroke', '#4299E1')
        .attr('stroke-width', 1);
    
    // Add text labels for each step
    stepGroups.append('text')
        .attr('x', 75)
        .attr('y', 30)
        .attr('text-anchor', 'middle')
        .attr('fill', '#2C5282')
        .style('font-size', '12px')
        .style('font-weight', '600')
        .text(d => d.title);
    
    // Initialize with the first step selected
    stepDetails.innerHTML = `
        <h4 class="font-semibold text-lg mb-2">${steps[0].title}</h4>
        <p class="mb-3">${steps[0].description}</p>
        <div class="bg-white p-3 rounded border border-blue-200">
            <p>${steps[0].details}</p>
        </div>
    `;
    
    // Highlight the first step
    svg.select('.step rect').attr('fill', '#BEE3F8');
}

// ===== Communication Style Simulator =====
function initCommunicationSimulator() {
    const scenarioSelector = document.getElementById('scenario-selector');
    const scenarioDescription = document.getElementById('scenario-description');
    const assertivenessSlider = document.getElementById('assertiveness-slider');
    const cooperativenessSlider = document.getElementById('cooperativeness-slider');
    const simulateButton = document.getElementById('simulate-button');
    const simulationResults = document.getElementById('simulation-results');
    const communicationStyle = document.getElementById('communication-style');
    
    if (!scenarioSelector || !simulateButton) return;
    
    // Define scenarios
    const scenarios = {
        scenario1: {
            title: "Maintenance Request Dispute",
            description: "A member has submitted multiple maintenance requests for a leaking faucet over the past month, but repairs haven't been completed. They're frustrated and confronting the maintenance coordinator at a community event."
        },
        scenario2: {
            title: "Common Space Usage Conflict",
            description: "Two members want to use the community room for different events scheduled at the same time. One member had informally reserved it weeks ago but didn't complete the official reservation form. The other member submitted the proper form yesterday."
        },
        scenario3: {
            title: "Noise Complaint Discussion",
            description: "A member approaches their neighbor about noise levels from late-night gatherings. This is the third time they've had this conversation in two months, and the noise has continued despite previous agreements to keep it down."
        }
    };
    
    // Update scenario description when selection changes
    scenarioSelector.addEventListener('change', function() {
        const selectedScenario = scenarios[this.value];
        if (selectedScenario) {
            scenarioDescription.innerHTML = `
                <h4 class="font-semibold mb-2">${selectedScenario.title}</h4>
                <p>${selectedScenario.description}</p>
            `;
        }
    });
    
    // Initialize with the first scenario
    scenarioSelector.value = 'scenario1';
    scenarioDescription.innerHTML = `
        <h4 class="font-semibold mb-2">${scenarios.scenario1.title}</h4>
        <p>${scenarios.scenario1.description}</p>
    `;
    
    // Simulate conversation when button is clicked
    simulateButton.addEventListener('click', function() {
        const assertiveness = parseInt(assertivenessSlider.value);
        const cooperativeness = parseInt(cooperativenessSlider.value);
        const scenarioKey = scenarioSelector.value;
        
        // Determine communication style based on sliders
        let style = '';
        if (assertiveness >= 7 && cooperativeness <= 3) {
            style = 'Competing';
        } else if (assertiveness <= 3 && cooperativeness >= 7) {
            style = 'Accommodating';
        } else if (assertiveness <= 3 && cooperativeness <= 3) {
            style = 'Avoiding';
        } else if (assertiveness >= 4 && assertiveness <= 6 && cooperativeness >= 4 && cooperativeness <= 6) {
            style = 'Compromising';
        } else if (assertiveness >= 7 && cooperativeness >= 7) {
            style = 'Collaborating';
        } else {
            style = 'Mixed';
        }
        
        // Generate simulation results based on scenario and communication style
        let results = '';
        
        if (scenarioKey === 'scenario1') {
            if (style === 'Competing') {
                results = `
                    <p class="mb-2"><strong>You:</strong> "This is completely unacceptable. I've submitted three requests already and nothing has been done. I need this fixed immediately or I'll bring it up at the next board meeting."</p>
                    <p class="mb-2"><strong>Maintenance Coordinator:</strong> "I understand you're frustrated, but there's a process we need to follow. Your tone isn't helping the situation."</p>
                    <p class="mb-2"><strong>You:</strong> "I don't care about the process. I care about having a working faucet. This needs to be your top priority."</p>
                    <p class="mb-4"><strong>Outcome:</strong> The maintenance coordinator feels defensive and the relationship is damaged. The repair might get done faster, but at the cost of goodwill and future cooperation.</p>
                `;
            } else if (style === 'Accommodating') {
                results = `
                    <p class="mb-2"><strong>You:</strong> "I'm sorry to bother you about this again. I know you're busy, but my faucet is still leaking."</p>
                    <p class="mb-2"><strong>Maintenance Coordinator:</strong> "Yes, I remember. We have several urgent repairs ahead of yours."</p>
                    <p class="mb-2"><strong>You:</strong> "That's fine, I understand. I can wait longer if needed."</p>
                    <p class="mb-4"><strong>Outcome:</strong> The relationship remains cordial, but your needs continue to be unmet. The repair remains low priority and may not be addressed for weeks.</p>
                `;
            } else if (style === 'Avoiding') {
                results = `
                    <p class="mb-2"><strong>You:</strong> *Sees the maintenance coordinator but decides not to mention the issue*</p>
                    <p class="mb-2"><strong>Maintenance Coordinator:</strong> "Hi there! Enjoying the community event?"</p>
                    <p class="mb-2"><strong>You:</strong> "Yes, it's nice. Well, I should go get some food..."</p>
                    <p class="mb-4"><strong>Outcome:</strong> No conflict occurs, but the problem remains unresolved. Your frustration continues to build, potentially affecting your satisfaction with the cooperative.</p>
                `;
            } else if (style === 'Compromising') {
                results = `
                    <p class="mb-2"><strong>You:</strong> "I wanted to check in about my faucet repair. It's been a month since my first request."</p>
                    <p class="mb-2"><strong>Maintenance Coordinator:</strong> "Yes, I know it's been a while. We've had several emergency repairs that took priority."</p>
                    <p class="mb-2"><strong>You:</strong> "I understand emergencies come first. Could we agree on a specific date for my repair so I know when to expect it?"</p>
                    <p class="mb-4"><strong>Outcome:</strong> You reach an agreement for the repair to be completed next week. It's not immediate, but having a specific timeline reduces your frustration.</p>
                `;
            } else if (style === 'Collaborating') {
                results = `
                    <p class="mb-2"><strong>You:</strong> "I'd like to talk about my faucet repair. I've submitted three requests, and I'm concerned about water waste and potential damage."</p>
                    <p class="mb-2"><strong>Maintenance Coordinator:</strong> "I appreciate you bringing this up. We've been overwhelmed with requests lately. Can you tell me more about the issue?"</p>
                    <p class="mb-2"><strong>You:</strong> "The leak is getting worse, and I'm worried about mold developing. I have some basic plumbing knowledge - would it help if I assisted with the repair to make it go faster?"</p>
                    <p class="mb-4"><strong>Outcome:</strong> Together you develop a plan that addresses both your need for a timely repair and the maintenance coordinator's limited resources. The coordinator agrees to prioritize your repair and provide materials if you can assist.</p>
                `;
            }
        } else if (scenarioKey === 'scenario2') {
            // Similar detailed responses for scenario 2
            if (style === 'Competing') {
                results = `
                    <p class="mb-2"><strong>You:</strong> "I told everyone weeks ago that I needed the room for this date. The form is just a formality."</p>
                    <p class="mb-2"><strong>Other Member:</strong> "But I followed the proper procedure and submitted the form. The rules clearly state that's how reservations work."</p>
                    <p class="mb-2"><strong>You:</strong> "My event is more important and I announced it first. I'm not changing my plans."</p>
                    <p class="mb-4"><strong>Outcome:</strong> The conflict escalates and may require board intervention. Community harmony is damaged, and neither party feels their concerns are respected.</p>
                `;
            } else if (style === 'Collaborating') {
                results = `
                    <p class="mb-2"><strong>You:</strong> "We seem to have a scheduling conflict. Let's figure out how we can both have successful events."</p>
                    <p class="mb-2"><strong>Other Member:</strong> "I did submit the form, but I understand you had mentioned your plans earlier."</p>
                    <p class="mb-2"><strong>You:</strong> "What are the specific needs for your event? Maybe we can find a way to share the space or find an alternative that works for both of us."</p>
                    <p class="mb-4"><strong>Outcome:</strong> You discover that one event could be moved to earlier in the day, or that another suitable space is available. Both events proceed successfully, and the experience leads to clearer reservation procedures in the future.</p>
                `;
            } else {
                results = `
                    <p class="mb-4">Select "Competing" or "Collaborating" style to see detailed results for this scenario.</p>
                `;
            }
        } else if (scenarioKey === 'scenario3') {
            // Similar detailed responses for scenario 3
            if (style === 'Avoiding') {
                results = `
                    <p class="mb-2"><strong>You:</strong> *Continues to be bothered by the noise but doesn't approach the neighbor again*</p>
                    <p class="mb-2"><strong>Neighbor:</strong> *Unaware that the noise is still an issue*</p>
                    <p class="mb-4"><strong>Outcome:</strong> The problem persists, your sleep continues to be disrupted, and resentment builds. You may eventually consider moving out of the cooperative.</p>
                `;
            } else if (style === 'Collaborating') {
                results = `
                    <p class="mb-2"><strong>You:</strong> "I wanted to talk about the noise issue again. I value you as a neighbor, but I'm still having trouble sleeping when you have late gatherings."</p>
                    <p class="mb-2"><strong>Neighbor:</strong> "I thought we had resolved this. My friends and I have been trying to be quieter."</p>
                    <p class="mb-2"><strong>You:</strong> "I appreciate that effort. Could we work together to find a solution that allows you to socialize while also respecting my need for sleep? Maybe we could identify specific quiet hours or sound-dampening strategies."</p>
                    <p class="mb-4"><strong>Outcome:</strong> You develop a detailed agreement about quiet hours, advance notice for gatherings, and sound-dampening measures. The neighbor better understands the impact of the noise, and you feel your concerns are being taken seriously.</p>
                `;
            } else {
                results = `
                    <p class="mb-4">Select "Avoiding" or "Collaborating" style to see detailed results for this scenario.</p>
                `;
            }
        }
        
        // Update the simulation results
        simulationResults.innerHTML = results;
        
        // Update communication style display
        communicationStyle.innerHTML = `
            <p class="font-semibold">${style}</p>
            <p>Assertiveness: ${assertiveness}/10, Cooperativeness: ${cooperativeness}/10</p>
            <p class="mt-2">This style is characterized by ${getStyleDescription(style)}</p>
        `;
    });
    
    // Helper function to get style descriptions
    function getStyleDescription(style) {
        const descriptions = {
            'Competing': 'high assertiveness and low cooperativeness. You focus on achieving your goals, sometimes at the expense of relationships.',
            'Accommodating': 'low assertiveness and high cooperativeness. You prioritize others\' needs and maintaining harmony over your own goals.',
            'Avoiding': 'low assertiveness and low cooperativeness. You tend to withdraw from conflict situations rather than addressing them directly.',
            'Compromising': 'moderate assertiveness and cooperativeness. You seek middle-ground solutions where everyone gives up something to reach agreement.',
            'Collaborating': 'high assertiveness and high cooperativeness. You work to find solutions that fully satisfy everyone\'s concerns.',
            'Mixed': 'a blend of different approaches. Your style may vary depending on the specific aspects of the situation.'
        };
        
        return descriptions[style] || '';
    }
}

// ===== Policy Development Wizard =====
function initPolicyWizard() {
    const policyTypeSelector = document.getElementById('policy-type-selector');
    const policyQuestions = document.getElementById('policy-questions');
    const policyPreview = document.getElementById('policy-preview');
    const policyContent = document.getElementById('policy-content');
    const downloadPolicy = document.getElementById('download-policy');
    
    if (!policyTypeSelector) return;
    
    // Define questions for each policy type
    const policyTypes = {
        conflict: {
            title: 'Conflict Resolution Policy',
            questions: [
                {
                    id: 'conflict-process',
                    label: 'What process would you like to use for initial conflict resolution?',
                    type: 'radio',
                    options: [
                        'Direct communication between parties first, then facilitated discussion if needed',
                        'Immediate involvement of a neutral third party',
                        'Written documentation of concerns before any discussion'
                    ]
                },
                {
                    id: 'conflict-mediators',
                    label: 'Who should serve as mediators in your cooperative?',
                    type: 'checkbox',
                    options: [
                        'Trained members from within the cooperative',
                        'Board members',
                        'External professional mediators',
                        'Representatives from other cooperatives'
                    ]
                },
                {
                    id: 'conflict-timeline',
                    label: 'What is your preferred timeline for addressing conflicts?',
                    type: 'select',
                    options: [
                        'Initial response within 48 hours, resolution process within 2 weeks',
                        'Initial response within 1 week, resolution process within 1 month',
                        'Timeline determined case-by-case based on severity'
                    ]
                }
            ]
        },
        communication: {
            title: 'Communication Policy',
            questions: [
                {
                    id: 'comm-channels',
                    label: 'Which communication channels should your cooperative use?',
                    type: 'checkbox',
                    options: [
                        'Email',
                        'Physical bulletin board',
                        'Digital messaging platform (e.g., Slack)',
                        'Regular in-person meetings',
                        'Newsletter',
                        'Website'
                    ]
                },
                {
                    id: 'comm-frequency',
                    label: 'How frequently should official cooperative communications be sent?',
                    type: 'radio',
                    options: [
                        'Weekly updates',
                        'Bi-weekly updates',
                        'Monthly updates with urgent matters communicated immediately'
                    ]
                }
            ]
        }
        // Additional policy types can be added here
    };
    
    // Show questions when policy type is selected
    policyTypeSelector.addEventListener('change', function() {
        const selectedPolicy = policyTypes[this.value];
        
        if (!selectedPolicy) {
            policyQuestions.classList.add('hidden');
            policyPreview.classList.add('hidden');
            return;
        }
        
        // Generate questions for the selected policy type
        let questionsHTML = `
            <h3 class="text-xl font-semibold mb-4">${selectedPolicy.title} Questions</h3>
            <form id="policy-form" class="space-y-6">
        `;
        
        selectedPolicy.questions.forEach(question => {
            questionsHTML += `<div class="mb-4">
                <label class="block font-medium mb-2">${question.label}</label>
            `;
            
            if (question.type === 'radio') {
                question.options.forEach((option, index) => {
                    questionsHTML += `
                        <div class="mb-2">
                            <input type="radio" id="${question.id}-${index}" name="${question.id}" value="${option}" class="mr-2">
                            <label for="${question.id}-${index}">${option}</label>
                        </div>
                    `;
                });
            } else if (question.type === 'checkbox') {
                question.options.forEach((option, index) => {
                    questionsHTML += `
                        <div class="mb-2">
                            <input type="checkbox" id="${question.id}-${index}" name="${question.id}" value="${option}" class="mr-2">
                            <label for="${question.id}-${index}">${option}</label>
                        </div>
                    `;
                });
            } else if (question.type === 'select') {
                questionsHTML += `<select id="${question.id}" name="${question.id}" class="w-full p-2 border border-gray-300 rounded">`;
                questionsHTML += `<option value="">-- Select an option --</option>`;
                
                question.options.forEach((option, index) => {
                    questionsHTML += `<option value="${option}">${option}</option>`;
                });
                
                questionsHTML += `</select>`;
            }
            
            questionsHTML += `</div>`;
        });
        
        questionsHTML += `
            <div class="mt-6">
                <button type="button" id="generate-policy" class="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
                    Generate Policy
                </button>
            </div>
            </form>
        `;
        
        policyQuestions.innerHTML = questionsHTML;
        policyQuestions.classList.remove('hidden');
        
        // Add event listener to the generate policy button
        document.getElementById('generate-policy').addEventListener('click', function() {
            generatePolicy(policyTypeSelector.value);
        });
    });
    
    // Generate policy based on form inputs
    function generatePolicy(policyType) {
        const selectedPolicy = policyTypes[policyType];
        if (!selectedPolicy) return;
        
        let policyHTML = `
            <h1 class="text-2xl font-bold mb-4">${selectedPolicy.title}</h1>
            <p class="mb-4">For [Cooperative Name]</p>
            
            <h2 class="text-xl font-semibold mb-2">Purpose</h2>
            <p class="mb-4">This policy establishes guidelines for ${policyType === 'conflict' ? 'resolving conflicts' : 'effective communication'} within our cooperative community.</p>
            
            <h2 class="text-xl font-semibold mb-2">Scope</h2>
            <p class="mb-4">This policy applies to all members of the cooperative.</p>
        `;
        
        if (policyType === 'conflict') {
            // Get form values
            const processValue = getRadioValue('conflict-process');
            const mediators = getCheckboxValues('conflict-mediators');
            const timeline = document.getElementById('conflict-timeline').value;
            
            policyHTML += `
                <h2 class="text-xl font-semibold mb-2">Conflict Resolution Process</h2>
                <p class="mb-4">${processValue || 'The cooperative will use a structured process for resolving conflicts.'}</p>
                
                <h2 class="text-xl font-semibold mb-2">Mediators</h2>
                <p class="mb-4">The following individuals may serve as mediators:</p>
                <ul class="list-disc pl-5 mb-4">
                    ${mediators.map(m => `<li>${m}</li>`).join('') || '<li>To be determined by the board</li>'}
                </ul>
                
                <h2 class="text-xl font-semibold mb-2">Timeline</h2>
                <p class="mb-4">${timeline || 'Timeline will be established on a case-by-case basis.'}</p>
            `;
        } else if (policyType === 'communication') {
            // Get form values
            const channels = getCheckboxValues('comm-channels');
            const frequency = getRadioValue('comm-frequency');
            
            policyHTML += `
                <h2 class="text-xl font-semibold mb-2">Communication Channels</h2>
                <p class="mb-4">The cooperative will use the following communication channels:</p>
                <ul class="list-disc pl-5 mb-4">
                    ${channels.map(c => `<li>${c}</li>`).join('') || '<li>To be determined by the board</li>'}
                </ul>
                
                <h2 class="text-xl font-semibold mb-2">Communication Frequency</h2>
                <p class="mb-4">${frequency || 'Communication frequency will be determined based on cooperative needs.'}</p>
            `;
        }
        
        policyHTML += `
            <h2 class="text-xl font-semibold mb-2">Review</h2>
            <p class="mb-4">This policy will be reviewed annually by the board of directors.</p>
            
            <p class="mt-8">Adopted: [Date]</p>
            <p>Last Reviewed: [Date]</p>
        `;
        
        // Display the generated policy
        policyContent.innerHTML = policyHTML;
        policyPreview.classList.remove('hidden');
    }
    
    // Helper function to get radio button value
    function getRadioValue(name) {
        const radios = document.getElementsByName(name);
        for (let i = 0; i < radios.length; i++) {
            if (radios[i].checked) {
                return radios[i].value;
            }
        }
        return '';
    }
    
    // Helper function to get checkbox values
    function getCheckboxValues(name) {
        const checkboxes = document.getElementsByName(name);
        const values = [];
        
        for (let i = 0; i < checkboxes.length; i++) {
            if (checkboxes[i].checked) {
                values.push(checkboxes[i].value);
            }
        }
        
        return values;
    }
    
    // Download policy as text file
    downloadPolicy.addEventListener('click', function() {
        const policyText = policyContent.innerText;
        const policyType = policyTypeSelector.options[policyTypeSelector.selectedIndex].text;
        const filename = policyType.replace(/\s+/g, '-').toLowerCase() + '.txt';
        
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(policyText));
        element.setAttribute('download', filename);
        
        element.style.display = 'none';
        document.body.appendChild(element);
        
        element.click();
        
        document.body.removeChild(element);
    });
}

